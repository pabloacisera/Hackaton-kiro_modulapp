# Tasks: Direct purchase (Flow A)

- [ ] TASK-compraA-1: Migration for `orders` table
  - Depends on: none

- [ ] TASK-compraA-2: `Order` domain entity + state machine (valid transition guards)
  - Depends on: TASK-compraA-1
  - Done criterion: tests that reject invalid transitions (e.g., rejected→accepted)

- [ ] TASK-compraA-3: `POST /orders` endpoint with server-side price/stock re-read and `build_on_demand` validation
  - Depends on: TASK-compraA-2, TASK-catalog-2

- [ ] TASK-compraA-4: HTTP client to `payment-service` to initiate payment
  - Depends on: TASK-compraA-3

- [ ] TASK-compraA-5: Webhook endpoint `POST /orders/webhooks/payment-result`
  - Depends on: TASK-compraA-4
  - Done criterion: validates webhook signature/origin (do not trust unvalidated requests)

- [ ] TASK-compraA-6: Payment confirmation email to customer (mandatory)
  - Depends on: TASK-compraA-5

- [ ] TASK-compraA-7: WebSocket notification to admin for new pending purchase
  - Depends on: TASK-compraA-5, TASK-notif-websocket (feature-realtime-notifications)

- [ ] TASK-compraA-8: `PATCH /orders/:id/accept` endpoint (deducts stock, sets ETA)
  - Depends on: TASK-compraA-5

- [ ] TASK-compraA-9: `PATCH /orders/:id/reject` endpoint (mandatory reason + automatic refund)
  - Depends on: TASK-compraA-5

- [ ] TASK-compraA-10: BullMQ reconciliation job for hung payments
  - Depends on: TASK-compraA-4

- [ ] TASK-compraA-11: Admin listing `GET /orders` with filters/search/pagination
  - Depends on: TASK-compraA-2

- [ ] TASK-compraA-12: Landing UI — "Buy" button and payment result screen
  - Depends on: TASK-compraA-3

- [ ] TASK-compraA-13: Admin UI — pending orders table with accept/reject actions
  - Depends on: TASK-compraA-11
