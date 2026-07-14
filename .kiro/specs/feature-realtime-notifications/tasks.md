# Tasks: Real-time notifications

- [ ] TASK-notif-1: Migration for `admin_notifications` table + `notifications` module with central `notifyAdmins()`
  - Context: Combines database setup and the core notification service. Migration creates the `admin_notifications` table with columns required by FR2 (type, short_message, reference, timestamp, read/unread status). The module exposes `notifyAdmins()` that formats and persists notifications then dispatches them via WebSocket gateway. Unit tests cover: notification creation with correct fields, mark_read propagation logic.
  - Deliverable: `services/api-core/src/modules/notifications/notifications.module.ts`, `services/api-core/src/modules/notifications/entities/admin-notification.entity.ts`, `services/api-core/src/modules/notifications/notifications.service.ts`, `services/api-core/src/modules/notifications/notifications.service.spec.ts`, `services/api-core/src/database/migrations/*_create_admin_notifications.ts`
  - Depends on: none
  - Assigned to: unassigned
  - Done criteria: migration runs without errors and creates `admin_notifications` table; `notifyAdmins()` persists a notification with correct fields (FR2) and returns the created entity; unit test `notification creation with correct fields` passes.

- [ ] TASK-notif-2: WebSocket Gateway (`@nestjs/websockets`) with JWT auth on handshake
  - Context: FR1 requires the admin panel to receive events without page reload. The gateway authenticates connections via JWT (depends on feature-admin-auth-core) and provides the transport layer for all admin notifications.
  - Deliverable: `services/api-core/src/modules/notifications/gateways/admin-notification.gateway.ts`, `services/api-core/src/modules/notifications/gateways/admin-notification.gateway.spec.ts`
  - Depends on: TASK-notif-1, feature-admin-auth-core
  - Assigned to: unassigned
  - Done criteria: gateway rejects connections without valid JWT; gateway accepts connections with valid JWT and stores client reference; unit test `gateway rejects without JWT` and `gateway accepts with valid JWT` pass.

- [ ] TASK-notif-3: `GET /admin/notifications?read=&page=` endpoint
  - Context: FR4 requires a notification center (dropdown panel) with recent history. This paginated endpoint serves unread counts and history to the frontend.
  - Deliverable: `services/api-core/src/modules/notifications/controllers/notifications.controller.ts`, `services/api-core/src/modules/notifications/controllers/notifications.controller.spec.ts`
  - Depends on: TASK-notif-1
  - Assigned to: unassigned
  - Done criteria: endpoint returns paginated notifications filtered by `read` query param; returns correct `total` and `unreadCount`; unit tests for pagination and filter logic pass.

- [ ] TASK-notif-4: `notification.mark_read` event (propagated to same admin multi-tab)
  - Context: Edge case from spec — admin may have dashboard open on multiple tabs; marking read on one must sync across all. This task implements the broadcast so all connected clients of the same admin see the updated read status. Unit test verifies propagation to multiple simulated clients.
  - Deliverable: `services/api-core/src/modules/notifications/gateways/admin-notification.gateway.ts` (updated), `services/api-core/src/modules/notifications/gateways/admin-notification.gateway.spec.ts` (updated)
  - Depends on: TASK-notif-2
  - Assigned to: unassigned
  - Done criteria: when a client emits `notification.mark_read`, all other clients connected with the same admin ID receive a `notification.read_updated` event with the notification ID and `read: true`; unit test `markRead propagates to all tabs` passes.

- [ ] TASK-notif-5: Integrate `notifyAdmins()` — direct-purchase flow
  - Context: FR1 — admin receives new purchase event (Flow A) without page reload. Calls `notifyAdmins()` from the direct-purchase module when an order is confirmed.
  - Deliverable: `services/api-core/src/modules/direct-purchase/` (updated service file calling `notifyAdmins`)
  - Depends on: TASK-notif-1, TASK-directpurchase-7
  - Assigned to: unassigned
  - Done criteria: after order confirmation, a notification of type `NEW_PURCHASE` is created with correct reference link (FR2); notification is delivered via WebSocket to connected admins.

- [ ] TASK-notif-6: Integrate `notifyAdmins()` — quotes flow
  - Context: FR1 — admin receives new quote request/response event (Flow B) without page reload. Calls `notifyAdmins()` from the quotes module on new request and response.
  - Deliverable: `services/api-core/src/modules/quotes/` (updated service file calling `notifyAdmins`)
  - Depends on: TASK-notif-1, TASK-quoteB-11
  - Assigned to: unassigned
  - Done criteria: after a quote request or response, a notification of type `NEW_QUOTE` or `QUOTE_RESPONSE` is created with correct reference link (FR2); notification is delivered via WebSocket to connected admins.

- [ ] TASK-notif-7: Integrate `notifyAdmins()` — complaints flow
  - Context: FR1 — admin receives new complaint event without page reload. Calls `notifyAdmins()` from the complaints module on new complaint.
  - Deliverable: `services/api-core/src/modules/complaints/` (updated service file calling `notifyAdmins`)
  - Depends on: TASK-notif-1, TASK-complaint-4
  - Assigned to: unassigned
  - Done criteria: after a complaint is created, a notification of type `NEW_COMPLAINT` is created with correct reference link (FR2); notification is delivered via WebSocket to connected admins.

- [ ] TASK-notif-8: Integrate `notifyAdmins()` — low-stock alarm
  - Context: FR1 — admin receives below-minimum stock alarm without page reload. Calls `notifyAdmins()` from the stock module when inventory drops below threshold.
  - Deliverable: `services/api-core/src/modules/stock/` (updated service file calling `notifyAdmins`)
  - Depends on: TASK-notif-1, TASK-stock-8
  - Assigned to: unassigned
  - Done criteria: after stock drops below minimum, a notification of type `LOW_STOCK` is created with correct supply reference (FR2); notification is delivered via WebSocket to connected admins.

- [ ] TASK-notif-9: `controllers/useNotifications.ts` (socket + sound queue with debounce)
  - Context: FR3 requires non-intrusive sound on new notification arrival. The edge case requires debounce so simultaneous notifications don't play overlapping sounds. This hook manages the WebSocket client connection and a sound queue.
  - Deliverable: `services/admin-app/src/controllers/useNotifications.ts`, `services/admin-app/src/controllers/useNotifications.spec.ts`
  - Depends on: TASK-notif-2
  - Assigned to: unassigned
  - Done criteria: hook connects to WebSocket with JWT; incoming notifications are queued; sound plays with debounce (edge case: 3 rapid notifications produce only one sound burst); unit tests for debounce logic pass.

- [ ] TASK-notif-10: `views/NotificationBell` + `views/NotificationPanel`
  - Context: FR4 requires a notification center dropdown panel with recent history and mark as read. The bell shows unread count; the panel lists notifications fetched from `GET /admin/notifications`.
  - Deliverable: `services/admin-app/src/views/NotificationBell.tsx`, `services/admin-app/src/views/NotificationPanel.tsx`
  - Depends on: TASK-notif-9, TASK-notif-3
  - Assigned to: unassigned
  - Done criteria: bell renders unread badge count; panel opens/closes on bell click; panel lists notifications from API; clicking a notification calls `notification.mark_read` (TASK-notif-4).

- [ ] TASK-notif-11: Sound asset selection + persisted on/off preference
  - Context: FR3 — configurable on/off by admin, moderate volume by default. Persists preference so it survives page reload.
  - Deliverable: `services/admin-app/src/assets/notification-sound.mp3`, `services/admin-app/src/controllers/useNotifications.ts` (updated with preference read/write)
  - Depends on: TASK-notif-9
  - Assigned to: unassigned
  - Done criteria: sound asset is ~300-500ms, moderate volume; preference is persisted (localStorage or user settings API); when preference is off, no sound plays on incoming notification.

- [ ] TASK-notif-12: Reconnection with backoff on WebSocket client
  - Context: Non-functional requirement — automatic reconnection on network drop. Prevents lost notifications when connection drops temporarily.
  - Deliverable: `services/admin-app/src/controllers/useNotifications.ts` (updated with reconnection logic)
  - Depends on: TASK-notif-9
  - Assigned to: unassigned
  - Done criteria: on disconnect, client attempts reconnection with exponential backoff; after successful reconnect, missed notifications are fetched via `GET /admin/notifications` (acceptance criteria: no notification lost).

- [ ] TASK-notif-integration: Integration tests for WebSocket event delivery and mark_read sync
  - Context: End-to-end validation of the full notification pipeline: WebSocket connection with JWT handshake, event delivery to connected clients, mark_read sync across simulated multi-tab clients. Uses NestJS WebSocket test client.
  - Deliverable: `services/api-core/src/modules/notifications/**/*.integration-spec.ts`
  - Depends on: TASK-notif-4, TASK-notif-5, TASK-notif-6, TASK-notif-7, TASK-notif-8, TASK-notif-12
  - Assigned to: unassigned
  - Done criteria: `integration.notification.websocket.connectsWithValidJWT` passes; `integration.notification.websocket.rejectsWithoutJWT` passes; `integration.notification.websocket.receivesNewPurchaseEvent` passes; `integration.notification.websocket.receivesNewComplaintEvent` passes; `integration.notification.websocket.markReadSyncsAcrossTabs` passes; all integration tests green.
