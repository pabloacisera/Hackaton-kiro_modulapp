# Tasks: Payment and billing microservice (Java/Spring Boot)

- [ ] TASK-pay-1: Spring Boot project scaffold (Maven), package structure controller/service/domain/repository/config
  - Depends on: none
  - Assigned to: unassigned
  - Done criterion: `./mvnw spring-boot:run` starts a `/health` endpoint OK

- [ ] TASK-pay-2: Configure own database connection (Postgres/Supabase, separate schema) + migrations (Flyway)
  - Depends on: TASK-pay-1
  - Assigned to: unassigned

- [ ] TASK-pay-3: JPA entities `Payment`, `Refund`, `Receipt`, `AuditLog`
  - Depends on: TASK-pay-2
  - Assigned to: unassigned

- [ ] TASK-pay-4: PayPal Orders API SDK/REST integration (sandbox first)
  - Depends on: TASK-pay-1
  - Assigned to: unassigned

- [ ] TASK-pay-5: `POST /payments/orders` endpoint with idempotency by `idempotency_key`
  - Depends on: TASK-pay-3, TASK-pay-4
  - Assigned to: unassigned

- [ ] TASK-pay-6: Webhook endpoint `POST /payments/webhooks/paypal` with signature validation and deduplication by `paypal_event_id`
  - Depends on: TASK-pay-4
  - Assigned to: unassigned

- [ ] TASK-pay-7: PDF receipt generation (customer + admin) on payment confirmation
  - Depends on: TASK-pay-6
  - Assigned to: unassigned

- [ ] TASK-pay-8: Receipt email sending to customer, with retry on failure (receipt already persisted before attempting to send)
  - Depends on: TASK-pay-7
  - Assigned to: unassigned

- [ ] TASK-pay-9: Outgoing webhook to `api-core` notifying payment result
  - Depends on: TASK-pay-6
  - Assigned to: unassigned

- [ ] TASK-pay-10: PayPal Refunds API integration
  - Depends on: TASK-pay-4
  - Assigned to: unassigned

- [ ] TASK-pay-11: `POST /payments/orders/:ref/refund` endpoint with idempotency by `refund_request_id`
  - Depends on: TASK-pay-10, TASK-pay-3
  - Assigned to: unassigned

- [ ] TASK-pay-12: Refund receipt generation and sending
  - Depends on: TASK-pay-11
  - Assigned to: unassigned

- [ ] TASK-pay-13: Immutable audit log for every financial operation
  - Depends on: TASK-pay-5, TASK-pay-11
  - Assigned to: unassigned

- [ ] TASK-pay-14: `GET /payments/:ref/receipt` endpoint
  - Depends on: TASK-pay-7
  - Assigned to: unassigned

- [ ] TASK-pay-15: Idempotency tests (double exact call does not duplicate charge or refund) — mandatory before merging (see steering 03, financial section)
  - Depends on: TASK-pay-5, TASK-pay-11
  - Assigned to: unassigned

- [ ] TASK-pay-test1: Unit tests for payment domain logic
  - Context: Payment, Refund, Receipt entities and idempotency logic must be tested. Covers: idempotency key uniqueness, state transitions (initiated→confirmed/failed), refund idempotency, audit log immutability.
  - Deliverable: `services/payment-service/src/test/java/**/*Test.java` (JUnit)
  - Depends on: TASK-pay-13
  - Assigned to: unassigned
  - Done criteria: unit.payment.idempotency.duplicateKeyReturnsExisting, unit.payment.stateTransition.initiatedToConfirmed, unit.payment.stateTransition.initiatedToFailed, unit.refund.idempotency.duplicateRequestReturnsExisting, unit.auditlog.immutability.cannotBeModified. All pass.

- [ ] TASK-pay-test2: Integration tests for PayPal sandbox flow
  - Context: validates full flow against PayPal sandbox: create order → capture → webhook confirmation → receipt generation. Also tests: refund flow, webhook signature validation, deduplication. Uses PayPal sandbox sandbox+test credentials.
  - Deliverable: `services/payment-service/src/test/java/**/*IntegrationTest.java`
  - Depends on: TASK-pay-15
  - Assigned to: unassigned
  - Done criteria: integration.payment.createOrder.returnsPaymentLink, integration.payment.webhookConfirmation.updatesStatusToConfirmed, integration.payment.webhookConfirmation.generatesReceipts, integration.payment.webhook.deduplicatesByEventId, integration.payment.refund.processesRefundAndGeneratesReceipt, integration.payment.refund.idempotentOnDuplicateRequest, integration.payment.receipt.servesPdfUrl. All pass.
