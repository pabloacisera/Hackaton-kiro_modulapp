# Tasks: Direct purchase (Flow A)

- [ ] TASK-directpurchase-1: Migration for `orders` table + `Order` domain entity with state machine
  - Context: Foundation for the entire direct purchase flow. FR2 requires server-side re-read of price/stock, which means orders must store the original product reference. FR3 requires statuses like `paid_pending_acceptance`. FR4 requires `accept`/`reject` with ETA and reason. The state machine enforces valid transitions and guards (e.g., stock deducted only on acceptance, rejection triggers refund).
  - Deliverable: `services/api-core/src/modules/orders/order.entity.ts`, `services/api-core/src/modules/orders/order.repository.ts`, `services/api-core/src/migrations/*orders*.ts`
  - Depends on: none
  - Assigned to: unassigned
  - Done criteria: Migration creates `orders` table with columns for id, customer_email, product_id, price_snapshot, status (enum: created, payment_initiated, paid_pending_acceptance, accepted, rejected, payment_failed), eta, rejection_reason, refund_id, timestamps. Order entity compiles. State machine rejects invalid transitions: created→accepted blocked, payment_failed→accepted blocked, rejected→accepted blocked. State machine allows valid transitions: created→payment_initiated, payment_initiated→paid_pending_acceptance, paid_pending_acceptance→accepted, paid_pending_acceptance→rejected. Unit tests in `services/api-core/src/modules/orders/**/*.spec.ts` cover all valid/invalid transitions and pass.

- [ ] TASK-directpurchase-2: `POST /orders` endpoint with server-side price/stock re-read and `build_on_demand` validation
  - Context: FR2 mandates that the system re-reads current price and stock from the DB before creating the payment order — never trusts client-side data. Edge case: if stock=0 and `build_on_demand` is `false`, payment must be blocked with a clear message before reaching PayPal. Customer email format is validated per non-functional requirements.
  - Deliverable: `services/api-core/src/modules/orders/orders.controller.ts`, `services/api-core/src/modules/orders/orders.service.ts`
  - Depends on: TASK-directpurchase-1, TASK-catalog-2
  - Assigned to: unassigned
  - Done criteria: `POST /orders` reads product price and stock from DB (not from request body). Returns 400 with message if stock=0 and `build_on_demand=false`. Validates customer email format (regex), returns 400 if invalid. Creates order with status `created`. Unit tests in `services/api-core/src/modules/orders/**/*.spec.ts` verify: price re-read ignores client payload, stock=0 + build_on_demand=false blocks, email validation rejects invalid format, valid request creates order. All tests pass.

- [ ] TASK-directpurchase-3: HTTP client to `payment-service` to initiate payment
  - Context: FR1 and non-functional requirements state all payment logic lives in `payment-service` (Java) — `api-core` only orchestrates the "initiate payment" request. This task creates the outbound HTTP client that calls payment-service after order creation. On success, order status transitions to `payment_initiated`.
  - Deliverable: `services/api-core/src/modules/orders/payment-client.ts`
  - Depends on: TASK-directpurchase-2
  - Assigned to: unassigned
  - Done criteria: `initiatePayment(orderId, amount, currency, customerEmail)` sends HTTP POST to payment-service endpoint with order details and receives a payment initiation response. On success, order status updates from `created` to `payment_initiated`. On failure, order status set to `payment_failed`. Unit tests mock HTTP client and verify: correct payload sent, success updates status, failure sets payment_failed. All tests pass.

- [ ] TASK-directpurchase-4: Webhook endpoint `POST /orders/webhooks/payment-result`
  - Context: FR3 requires the system to receive payment confirmation webhooks from payment-service. Edge case from specs: if webhook is lost due to network failure, the reconciliation job catches it later. Must validate webhook signature/origin — never trust unvalidated requests. On successful webhook: order moves to `paid_pending_acceptance`. On failure: order moves to `payment_failed`.
  - Deliverable: `services/api-core/src/modules/orders/orders.controller.ts` (webhook route), `services/api-core/src/modules/orders/webhook.validator.ts`
  - Depends on: TASK-directpurchase-3
  - Assigned to: unassigned
  - Done criteria: `POST /orders/webhooks/payment-result` validates webhook signature before processing. Valid success webhook transitions order from `payment_initiated` to `paid_pending_acceptance`. Valid failure webhook transitions to `payment_failed`. Invalid signature returns 401/403 without processing. Unit tests verify: valid signature accepted, invalid signature rejected, success status transition, failure status transition. All tests pass.

- [ ] TASK-directpurchase-5: Payment confirmation email to customer
  - Context: FR3 mandates a confirmation email is sent to the customer after successful payment. Non-functional requirement states the email is mandatory — without a valid email the payment cannot be executed. Email includes estimated wait time if applicable.
  - Deliverable: `services/api-core/src/modules/orders/order-email.service.ts`
  - Depends on: TASK-directpurchase-4
  - Assigned to: unassigned
  - Done criteria: On `paid_pending_acceptance` transition, email is sent to customer with order summary and ETA (if set). Email failure is logged but does not block order flow (email is mandatory but async). Unit tests verify: email sent on paid_pending_acceptance, email content includes order details and ETA, email not sent on payment_failed. All tests pass.

- [ ] TASK-directpurchase-6: WebSocket notification to admin for new pending purchase
  - Context: FR3 requires the admin to be notified in real-time via WebSocket when a new purchase is pending acceptance.
  - Deliverable: `services/api-core/src/modules/orders/order-notification.service.ts`
  - Depends on: TASK-directpurchase-4, TASK-notif-3 (feature-realtime-notifications)
  - Assigned to: unassigned
  - Done criteria: On `paid_pending_acceptance` transition, WebSocket message is sent to admin channel with order summary (customer email, product, price). Unit tests verify: notification sent on paid_pending_acceptance, notification payload contains required fields, notification not sent on other transitions. All tests pass.

- [ ] TASK-directpurchase-7: `PATCH /orders/:id/accept` endpoint (deducts stock, sets ETA)
  - Context: FR4 defines the admin accept action: must set an estimated delivery time, and stock is deducted only at this point (not at payment). Acceptance transitions order from `paid_pending_acceptance` to `accepted`.
  - Deliverable: `services/api-core/src/modules/orders/orders.controller.ts` (accept route), `services/api-core/src/modules/orders/orders.service.ts` (accept logic)
  - Depends on: TASK-directpurchase-5
  - Assigned to: unassigned
  - Done criteria: `PATCH /orders/:id/accept` requires ETA in body. Only works on orders in `paid_pending_acceptance` status. Deducts stock from catalog. Sets ETA on order. Transitions status to `accepted`. Returns 400 if ETA missing, 404 if order not found, 409 if order not in `paid_pending_acceptance`. Unit tests verify: valid accept deducts stock and sets ETA, missing ETA returns 400, wrong status returns 409, stock deduction called. All tests pass.

- [ ] TASK-directpurchase-8: `PATCH /orders/:id/reject` endpoint (mandatory reason + automatic refund)
  - Context: FR4 defines the admin reject action: mandatory justification and triggers automatic refund via PayPal Refunds API (through payment-service). No stock deduction on rejection. Notifies customer by email. Transitions order from `paid_pending_acceptance` to `rejected`.
  - Deliverable: `services/api-core/src/modules/orders/orders.controller.ts` (reject route), `services/api-core/src/modules/orders/orders.service.ts` (reject logic), `services/api-core/src/modules/orders/refund-client.ts`
  - Depends on: TASK-directpurchase-5
  - Assigned to: unassigned
  - Done criteria: `PATCH /orders/:id/reject` requires `reason` in body. Only works on `paid_pending_acceptance` orders. Calls payment-service refund endpoint. Stores refund ID on order. Transitions status to `rejected`. Sends rejection email to customer. Returns 400 if reason missing, 404 if order not found, 409 if wrong status. Unit tests verify: valid reject calls refund and sets status, missing reason returns 400, wrong status returns 409, refund failure is handled, rejection email sent. All tests pass.

- [ ] TASK-directpurchase-9: BullMQ reconciliation job for hung payments
  - Context: Edge case from specs: if PayPal confirms payment but the webhook doesn't reach `api-core` (network failure), a reconciliation job checks actual status on PayPal every X minutes for orders in `payment_initiated` status without confirmation.
  - Deliverable: `services/api-core/src/modules/orders/reconciliation.job.ts`
  - Depends on: TASK-directpurchase-3
  - Assigned to: unassigned
  - Done criteria: BullMQ job runs on schedule (configurable interval). Queries orders in `payment_initiated` status older than threshold. Calls payment-service to check actual PayPal status. If payment confirmed, transitions to `paid_pending_acceptance`. If payment failed, transitions to `payment_failed`. Logs all reconciliation actions. Unit tests verify: job finds hung orders, calls payment-service for status check, transitions correctly on confirmed/failed, handles payment-service errors gracefully. All tests pass.

- [ ] TASK-directpurchase-10: Admin listing `GET /orders` with filters/search/pagination
  - Context: Admin needs to view and manage orders from the dashboard. FR4 defines the admin accept/reject actions which require a way to list orders.
  - Deliverable: `services/api-core/src/modules/orders/orders.controller.ts` (list route), `services/api-core/src/modules/orders/orders.service.ts` (list logic)
  - Depends on: TASK-directpurchase-1
  - Assigned to: unassigned
  - Done criteria: `GET /orders` returns paginated list of orders. Supports filters by status, customer email (search), date range. Supports pagination with page/limit query params. Returns total count in response. Unit tests verify: returns paginated results, filter by status works, search by email works, pagination metadata correct, empty results for no matches. All tests pass.

- [ ] TASK-directpurchase-11: Landing UI — "Buy" button and payment result screen
  - Context: FR1 requires customer selects prototype and goes directly to payment gateway. UI must show the buy action and handle payment result display.
  - Deliverable: `apps/landing/src/components/DirectPurchaseButton.tsx`, `apps/landing/src/components/PaymentResult.tsx`, `apps/landing/src/app/api/orders/route.ts` (or equivalent Next.js API route)
  - Depends on: TASK-directpurchase-2
  - Assigned to: unassigned
  - Done criteria: "Buy" button visible on prototype page when prototype is available. Clicking opens purchase flow with email input (validated client-side). On submit, calls `POST /orders` and redirects to payment. Payment result screen shows success/failure/status. Loading and error states handled. Unit tests (component): renders buy button, email validation blocks invalid, submits order creation call, renders payment result states. All tests pass.

- [ ] TASK-directpurchase-12: Admin UI — pending orders table with accept/reject actions
  - Context: FR4 requires admin to accept or reject orders from the dashboard. Admin UI must display pending orders and provide accept/reject actions with appropriate inputs (ETA for accept, reason for reject).
  - Deliverable: `apps/admin/src/components/OrdersTable.tsx`, `apps/admin/src/components/AcceptOrderDialog.tsx`, `apps/admin/src/components/RejectOrderDialog.tsx`
  - Depends on: TASK-directpurchase-10
  - Assigned to: unassigned
  - Done criteria: Orders table fetches from `GET /orders` and displays orders with status, customer email, product, price. Accept dialog opens with ETA date/time input, calls `PATCH /orders/:id/accept`. Reject dialog opens with mandatory reason textarea, calls `PATCH /orders/:id/reject`. Status updates reflect in table after action. Error states handled. Unit tests (component): renders order list, accept dialog validates ETA required, reject dialog validates reason required, calls correct API on submit. All tests pass.

- [ ] TASK-directpurchase-13: Integration tests for full direct purchase flow
  - Context: Validates the complete flow end-to-end: create order → initiate payment (mocked) → webhook OK → paid_pending_acceptance → accept (deducts stock) / reject (triggers refund). Also tests: stock=0 with build_on_demand=false blocks order, reconciliation job catches hung payments. Uses Supertest with mocked payment-service.
  - Deliverable: `services/api-core/src/modules/orders/**/*.integration-spec.ts`
  - Depends on: TASK-directpurchase-12
  - Assigned to: unassigned
  - Done criteria: Integration tests cover: (1) full happy path create→pay→webhook→accept with stock deduction, (2) full reject path create→pay→webhook→reject with refund, (3) stock=0 + build_on_demand=false blocks before payment, (4) reconciliation job catches and resolves hung payment, (5) invalid webhook signature rejected, (6) email sent on payment success, (7) WebSocket notification sent to admin on pending order. All tests pass with payment-service mocked via contract from design.md.
