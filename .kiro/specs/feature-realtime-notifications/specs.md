# Specs: Real-time notifications

## What it is

Cross-cutting layer used by other features to notify the admin (via WebSocket) or sync the landing (via SSE).

## Functional requirements

- FR1. Admin panel receives, without page reload, events: new purchase (Flow A), new quote request/response (Flow B), new complaint, below-minimum stock alarm, confirmed payment.
- FR2. Each notification has: type, short message, reference (direct link to the resource: order/quote/complaint/supply), timestamp, read/unread status.
- FR3. Non-intrusive sound on new notification arrival (configurable on/off by admin, moderate volume by default).
- FR4. Notification center (dropdown panel) with recent history and mark as read.
- FR5. Landing receives (SSE) only catalog events (price/stock/availability) — no internal admin events.

## Non-functional requirements

- Automatic reconnection on network drop, both in WebSocket (admin) and SSE (landing).
- Notifications do not replace mandatory emails in each flow — they are an additional channel for immediate admin reaction.

## Edge cases

- Admin has the dashboard open on two tabs/devices → both receive the event; marking as read on one should not desync the other in a confusing way (read state is synced via the same channel).
- Multiple events arrive almost simultaneously (e.g., 3 complaints in a row) → 3 sounds do not play simultaneously (debounce/sound queue).

## Acceptance criteria

- No critical notification (new purchase, new complaint) is lost if the admin does not have the dashboard open at the time — on reopening, they see the unread history.
