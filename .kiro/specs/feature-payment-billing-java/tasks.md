# Tasks: Payment and billing microservice (Java/Spring Boot)

- [ ] TASK-pay-1: Spring Boot project scaffold (Maven), package structure controller/service/domain/repository/config
  - Depends on: none
  - Done criterion: `./mvnw spring-boot:run` starts a `/health` endpoint OK

- [ ] TASK-pay-2: Configure own database connection (Postgres/Supabase, separate schema) + migrations (Flyway)
  - Depends on: TASK-pay-1

- [ ] TASK-pay-3: JPA entities `Payment`, `Refund`, `Receipt`, `AuditLog`
  - Depends on: TASK-pay-2

- [ ] TASK-pay-4: PayPal Orders API SDK/REST integration (sandbox first)
  - Depends on: TASK-pay-1

- [ ] TASK-pay-5: `POST /payments/orders` endpoint with idempotency by `idempotency_key`
  - Depends on: TASK-pay-3, TASK-pay-4

- [ ] TASK-pay-6: Webhook endpoint `POST /payments/webhooks/paypal` with signature validation and deduplication by `paypal_event_id`
  - Depends on: TASK-pay-4

- [ ] TASK-pay-7: PDF receipt generation (customer + admin) on payment confirmation
  - Depends on: TASK-pay-6

- [ ] TASK-pay-8: Receipt email sending to customer, with retry on failure (receipt already persisted before attempting to send)
  - Depends on: TASK-pay-7

- [ ] TASK-pay-9: Outgoing webhook to `api-core` notifying payment result
  - Depends on: TASK-pay-6

- [ ] TASK-pay-10: PayPal Refunds API integration
  - Depends on: TASK-pay-4

- [ ] TASK-pay-11: `POST /payments/orders/:ref/refund` endpoint with idempotency by `refund_request_id`
  - Depends on: TASK-pay-10, TASK-pay-3

- [ ] TASK-pay-12: Refund receipt generation and sending
  - Depends on: TASK-pay-11

- [ ] TASK-pay-13: Immutable audit log for every financial operation
  - Depends on: TASK-pay-5, TASK-pay-11

- [ ] TASK-pay-14: `GET /payments/:ref/receipt` endpoint
  - Depends on: TASK-pay-7

- [ ] TASK-pay-15: Idempotency tests (double exact call does not duplicate charge or refund) — mandatory before merging (see steering 03, financial section)
  - Depends on: TASK-pay-5, TASK-pay-11
