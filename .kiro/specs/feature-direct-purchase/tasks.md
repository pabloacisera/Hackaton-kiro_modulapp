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
  - Depends on: TASK-directpurchase-5, TASK-notif-3 (feature-realtime-notifications)
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

- [ ] TASK-directpurchase-test1: Unit tests for order state machine guards
  - Context: Order entity has strict state transitions. Must test: valid transitions (created→payment_initiated→paid_pending_acceptance→accepted, →rejected), invalid transitions blocked (e.g., created→accepted, payment_failed→accepted). Also test: stock deduction only on acceptance, no stock deduction on rejection.
  - Deliverable: `services/api-core/src/modules/orders/**/*.spec.ts`
  - Depends on: TASK-directpurchase-9
  - Assigned to: unassigned
  - Done criteria: unit.order.stateMachine.validTransitionsAllowed, unit.order.stateMachine.invalidTransitionsBlocked, unit.order.stockDeduction.onlyOnAcceptance, unit.order.rejectionTriggersRefund. All pass.

- [ ] TASK-directpurchase-test2: Integration tests for full purchase flow (with payment-service mock)
  - Context: validates complete flow: create order → initiate payment (mocked) → webhook OK → paid_pending_acceptance → accept (deducts stock) / reject (triggers refund mock). Also tests: stock=0 with build_on_demand=false blocks payment, reconciliation job catches hung payments. Uses Supertest with mocked payment-service (based on contract in design.md).
  - Deliverable: `services/api-core/src/modules/orders/**/*.integration-spec.ts`
  - Depends on: TASK-directpurchase-13
  - Assigned to: unassigned
  - Done criteria: integration.order.create.readsPriceServerSide, integration.order.create.blocksWhenStockZeroAndNotBuildOnDemand, integration.order.create.callsPaymentServiceMock, integration.order.webhookOK.movesToPaidPendingAcceptance, integration.order.webhookFailedMovesToPaymentFailed, integration.order.accept.deductsStockAndSetsETA, integration.order.accept.sendsReceipt, integration.order.reject.callsRefundMockAndNotifiesCustomer, integration.order.reconciliation.catchesHungPayments. All pass.
