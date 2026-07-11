# Tasks: Direct purchase (Flow A)

- [ ] TASK-directpurchase-1: Migration for `orders` table
  - Depends on: none
  - Assigned to: unassigned

- [ ] TASK-directpurchase-2: `Order` domain entity + state machine (valid transition guards)
  - Depends on: TASK-directpurchase-1
  - Assigned to: unassigned
  - Done criterion: tests that reject invalid transitions (e.g., rejected→accepted)

- [ ] TASK-directpurchase-3: `POST /orders` endpoint with server-side price/stock re-read and `build_on_demand` validation
  - Depends on: TASK-directpurchase-2, TASK-catalog-2
  - Assigned to: unassigned

- [ ] TASK-directpurchase-4: HTTP client to `payment-service` to initiate payment
  - Depends on: TASK-directpurchase-3
  - Assigned to: unassigned

- [ ] TASK-directpurchase-5: Webhook endpoint `POST /orders/webhooks/payment-result`
  - Depends on: TASK-directpurchase-4
  - Assigned to: unassigned
  - Done criterion: validates webhook signature/origin (do not trust unvalidated requests)

- [ ] TASK-directpurchase-6: Payment confirmation email to customer (mandatory)
  - Depends on: TASK-directpurchase-5
  - Assigned to: unassigned

- [ ] TASK-directpurchase-7: WebSocket notification to admin for new pending purchase
  - Depends on: TASK-directpurchase-5, TASK-notif-websocket (feature-realtime-notifications)
  - Assigned to: unassigned

- [ ] TASK-directpurchase-8: `PATCH /orders/:id/accept` endpoint (deducts stock, sets ETA)
  - Depends on: TASK-directpurchase-5
  - Assigned to: unassigned

- [ ] TASK-directpurchase-9: `PATCH /orders/:id/reject` endpoint (mandatory reason + automatic refund)
  - Depends on: TASK-directpurchase-5
  - Assigned to: unassigned

- [ ] TASK-directpurchase-10: BullMQ reconciliation job for hung payments
  - Depends on: TASK-directpurchase-4
  - Assigned to: unassigned

- [ ] TASK-directpurchase-11: Admin listing `GET /orders` with filters/search/pagination
  - Depends on: TASK-directpurchase-2
  - Assigned to: unassigned

- [ ] TASK-directpurchase-12: Landing UI — "Buy" button and payment result screen
  - Depends on: TASK-directpurchase-3
  - Assigned to: unassigned

- [ ] TASK-directpurchase-13: Admin UI — pending orders table with accept/reject actions
  - Depends on: TASK-directpurchase-11
  - Assigned to: unassigned
