# Design: Real-time notifications

## Data model

```
AdminNotification {
  id: uuid
  type: enum(new_purchase, new_quote_request, quote_response,
             new_complaint, low_stock_minimum, payment_confirmed)
  message: string
  reference_url: string      // deep link to the resource in admin
  read: boolean
  created_at
}
```

It is **always** persisted (not just emitted via WebSocket) so that the history survives the admin not being connected at the time.

## Backend

- `notifications` module in `api-core` with a single entry point
  `notifyAdmins(type, message, referenceUrl)` used by other modules
  (orders, quotes, complaints, supplies) — so no feature reimplements the transport.
- WebSocket Gateway (`@nestjs/websockets`) that:
  - On connect, sends the unread listing (`GET` initial via the same socket or REST `GET /admin/notifications?read=false`).
  - Emits `notification.new` event to all connected admins.
  - Receives `notification.mark_read` `{ id }` event from the client and propagates it to other connections of the same admin (multi-tab).
- Separate SSE endpoint `GET /catalog/stream` (already defined in `feature-catalog-landing`) — does not share a channel with the admin one.

## Admin frontend

- `controllers/useNotifications.ts`: maintains the socket, sound playback queue with debounce (max 1 sound every 2s even if bursts arrive), unread state.
- `views/NotificationBell` (badge with counter) + `views/NotificationPanel` (dropdown with history).
- Sound on/off preference saved in admin's browser `localStorage` (this is not a Claude artifact, it's the real app — allowed).

## Sound asset

Short sound (~300-500ms), soft "pop" or "chime" tone, moderate default volume (~40%). The final file is documented in `docs/notification-assets.md` once chosen with design.
