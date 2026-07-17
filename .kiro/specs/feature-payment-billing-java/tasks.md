# Tasks: Payment and billing microservice (Java/Spring Boot)

## Scaffold and infrastructure

- [ ] TASK-pay-1: Spring Boot project scaffold (Maven), package structure controller/service/domain/repository/config
  - Context: Foundation for the entire payment service. First Java service in the project (see `docs/java-springboot-guide.md`).
  - Deliverable: `apps/payment-service/pom.xml`, `apps/payment-service/src/main/java/com/modula/payment/{controller,service,domain,repository,config}/**`, `apps/payment-service/src/main/resources/application.yml`
  - Depends on: none
  - Assigned to: unassigned
  - Done criteria: `./mvnw spring-boot:run` starts and `GET /health` returns 200 OK. Package structure exists with all five packages.

- [ ] TASK-pay-2: Configure own database connection (Postgres/Supabase, separate schema) + migrations (Flyway)
  - Context: NFR — the service has its own database schema; it does not share tables directly with `api-core`.
  - Deliverable: `apps/payment-service/src/main/resources/application.yml` (datasource config), `apps/payment-service/src/main/resources/db/migration/V1__init.sql`
  - Depends on: TASK-pay-1
  - Assigned to: unassigned
  - Done criteria: Flyway migrates successfully on startup. `SELECT 1` against the configured schema succeeds. Application starts without datasource errors.

- [ ] TASK-pay-3: JPA entities `Payment`, `Refund`, `Receipt`, `AuditLog` + Flyway schema
  - Context: Domain model for all financial records. NFR — amounts must use `BigDecimal`, never `float`/`double`. AuditLog is immutable (no update/delete).
  - Deliverable: `apps/payment-service/src/main/java/com/modula/payment/domain/{Payment,Refund,Receipt,AuditLog}.java`, `apps/payment-service/src/main/resources/db/migration/V2__entities.sql`
  - Depends on: TASK-pay-2
  - Assigned to: unassigned
  - Done criteria: All four entities map correctly to their tables. `BigDecimal` used for all monetary fields. AuditLog table has no UPDATE/DELETE grants. Application starts, Flyway applies V2 cleanly.

## Audit aspect (cross-cutting concern, introduced early)

- [ ] TASK-pay-4: Audit log aspect — `@Audited` annotation + AOP interceptor
  - Context: NFR — all money operations are logged in an immutable audit log (who requested, when, PayPal result, amount). Creating the aspect early allows it to be applied to each financial endpoint as it is built, avoiding retrofitting.
  - Deliverable: `apps/payment-service/src/main/java/com/modula/payment/domain/AuditLog.java` (if not yet complete), `apps/payment-service/src/main/java/com/modula/payment/config/AuditAspect.java`, `apps/payment-service/src/main/java/com/modula/payment/config/Audited.java`
  - Depends on: TASK-pay-3
  - Assigned to: unassigned
  - Done criteria: Any Spring method annotated with `@Audited` that throws no exception produces an immutable `AuditLog` row containing: actor, timestamp, operation name, reference_id, amount, and PayPal result. Unit test verifies immutability (cannot update/delete audit row). Unit test verifies aspect fires on annotated method and is skipped on unannotated method.

## PayPal integration layer

- [ ] TASK-pay-5: PayPal Orders API SDK/REST integration (sandbox first)
  - Context: FR1/FR2 foundation — all PayPal communication flows through this client. Sandbox credentials required.
  - Deliverable: `apps/payment-service/src/main/java/com/modula/payment/service/PayPalClient.java`, `apps/payment-service/src/main/java/com/modula/payment/config/PayPalConfig.java`
  - Depends on: TASK-pay-1
  - Assigned to: unassigned
  - Done criteria: `PayPalClient.createOrder(amount, reference)` returns a PayPal order with approval URL. `PayPalClient.captureOrder(orderId)` returns capture details. Unit test mocks HTTP calls and verifies correct PayPal API endpoints, headers, and request body. Unit test verifies timeout/error handling returns a clear error object (no exceptions leaking).

## Payment initiation flow

- [ ] TASK-pay-6: `POST /payments/orders` endpoint — initiate payment with idempotency
  - Context: FR1 — receives `{ reference_id, amount_usd, customer_email, origin: 'order'|'quote' }`, creates a PayPal order, returns `payment_link`. NFR — retrying with the same `reference_id` must not duplicate the charge. Edge case — PayPal error/timeout returns clear error, nothing marked as paid.
  - Deliverable: `apps/payment-service/src/main/java/com/modula/payment/controller/PaymentController.java`, `apps/payment-service/src/main/java/com/modula/payment/service/PaymentService.java`, `apps/payment-service/src/test/java/com/modula/payment/service/PaymentServiceTest.java`
  - Depends on: TASK-pay-3, TASK-pay-4, TASK-pay-5
  - Assigned to: unassigned
  - Done criteria: `POST /payments/orders` with a new `reference_id` creates a PayPal order and returns `payment_link` + 201. Second call with same `reference_id` returns the same `payment_link` + 200 (no duplicate PayPal order). PayPal error returns 4xx with clear message, no `Receipt` or `Payment` record created. `@Audited` is applied — an `AuditLog` row is created for each call (success or failure). Unit test covers idempotency (duplicate key returns existing), state transitions (initiated→created), and PayPal error handling.

## Webhook processing

- [ ] TASK-pay-7: Webhook endpoint `POST /payments/webhooks/paypal` — signature validation + deduplication
  - Context: FR2 — receives PayPal native webhook (IPN/webhook v2) to confirm payment result. Edge case — PayPal may resend webhooks; must deduplicate by `paypal_event_id`, each event processed only once.
  - Deliverable: `apps/payment-service/src/main/java/com/modula/payment/controller/WebhookController.java`, `apps/payment-service/src/main/java/com/modula/payment/service/WebhookService.java`, `apps/payment-service/src/test/java/com/modula/payment/service/WebhookServiceTest.java`
  - Depends on: TASK-pay-5, TASK-pay-6
  - Assigned to: unassigned
  - Done criteria: Valid webhook with new `paypal_event_id` updates `Payment.status` to `CONFIRMED`. Duplicate `paypal_event_id` returns 200 but does not re-process (no duplicate side effects). Invalid signature returns 401. Unit test covers deduplication (same event_id processed only once), signature validation failure, and state transition (INITIATED→CONFIRMED).

## Outgoing webhook to api-core

- [ ] TASK-pay-8: Outgoing webhook to `api-core` notifying payment result
  - Context: FR2 — after confirming payment via PayPal webhook, the service must notify `api-core` via its own webhook.
  - Deliverable: `apps/payment-service/src/main/java/com/modula/payment/service/ApiCoreWebhookClient.java`, `apps/payment-service/src/test/java/com/modula/payment/service/ApiCoreWebhookClientTest.java`
  - Depends on: TASK-pay-7
  - Assigned to: unassigned
  - Done criteria: After webhook confirmation, an HTTP POST is sent to `api-core` with payment result payload. Retries on transient failure (3 attempts). Unit test verifies correct payload, endpoint, and retry behavior on 5xx.

## Receipt generation and delivery (payment)

- [ ] TASK-pay-9: PDF receipt generation (customer + admin) on payment confirmation
  - Context: FR4 — generate a receipt (simple PDF, non-fiscal) for each successful payment: one addressed to the customer (with amount, concept, date) and one addressed to the admin (same content + internal reference). NFR — every successful payment has a persisted receipt before being considered "complete" internally.
  - Deliverable: `apps/payment-service/src/main/java/com/modula/payment/service/ReceiptService.java`, `apps/payment-service/src/main/java/com/modula/payment/service/PdfGenerator.java`, `apps/payment-service/src/test/java/com/modula/payment/service/ReceiptServiceTest.java`
  - Depends on: TASK-pay-7
  - Assigned to: unassigned
  - Done criteria: On payment confirmation, two PDF files are generated (customer receipt + admin receipt) and persisted as `Receipt` entities with `PAYMENT` type. PDF contains correct amount, concept, date, and customer/admin distinction. Unit test verifies PDF content (customer vs admin fields), correct receipt type, and that receipts are persisted before any side effect (email, webhook).

- [ ] TASK-pay-10: Receipt email sending to customer, with retry on failure
  - Context: FR5 — send the customer's receipt by email automatically upon payment confirmation. Edge case — if email fails, the receipt is already persisted anyway; sending is retried (receipt not lost due to mail failure).
  - Deliverable: `apps/payment-service/src/main/java/com/modula/payment/service/EmailService.java`, `apps/payment-service/src/test/java/com/modula/payment/service/EmailServiceTest.java`
  - Depends on: TASK-pay-9
  - Assigned to: unassigned
  - Done criteria: Customer receipt PDF is attached and sent to `customer_email`. If email fails, retry up to 3 times with exponential backoff. Receipt remains persisted even if all retries fail. Unit test verifies email content, attachment, retry behavior on failure, and that receipt entity is unaffected by email failure.

## Refund flow

- [ ] TASK-pay-11: PayPal Refunds API integration
  - Context: FR3 foundation — execute refunds via PayPal Refunds API. Edge case — a refund requested twice for the same payment (due to `api-core` retry after timeout) must detect existing refund and return it, without refunding twice.
  - Deliverable: `apps/payment-service/src/main/java/com/modula/payment/service/PayPalRefundClient.java`, `apps/payment-service/src/test/java/com/modula/payment/service/PayPalRefundClientTest.java`
  - Depends on: TASK-pay-5
  - Assigned to: unassigned
  - Done criteria: `PayPalRefundClient.refund(captureId, amount)` calls PayPal Refunds API and returns refund details. Unit test mocks HTTP and verifies correct API endpoint, request body, and error handling (PayPal rejection returns clear error, no double refund).

- [ ] TASK-pay-12: `POST /payments/orders/:ref/refund` endpoint — execute refund with idempotency + audit
  - Context: FR3 — automatic refund when `api-core` requests it (order rejection or approved complaint). NFR — idempotency by `refund_request_id`; retrying with same ID returns existing result without refunding twice. Edge case — detect existing refund for reference and return it.
  - Deliverable: `apps/payment-service/src/main/java/com/modula/payment/service/RefundService.java`, `apps/payment-service/src/test/java/com/modula/payment/service/RefundServiceTest.java`
  - Depends on: TASK-pay-3, TASK-pay-4, TASK-pay-11
  - Assigned to: unassigned
  - Done criteria: `POST /payments/orders/:ref/refund` with new `refund_request_id` executes PayPal refund and returns refund details. Same `refund_request_id` returns existing refund (no duplicate PayPal call). `@Audited` is applied — `AuditLog` row created for each refund attempt (success or failure). Unit test covers idempotency (duplicate request returns existing), state transitions, and PayPal error handling.

- [ ] TASK-pay-13: Refund receipt generation + email to customer (atomic)
  - Context: FR6 — generate an equivalent receipt for an executed refund (for customer and admin). The receipt is emailed immediately after generation (atomic operation).
  - Deliverable: `apps/payment-service/src/main/java/com/modula/payment/service/ReceiptService.java` (extend), `apps/payment-service/src/test/java/com/modula/payment/service/ReceiptServiceTest.java` (extend)
  - Depends on: TASK-pay-10, TASK-pay-12
  - Assigned to: unassigned
  - Done criteria: After refund confirmation, two PDF receipts are generated (customer + admin) with `REFUND` type and persisted. Customer receipt is emailed immediately. Email failure triggers retry without losing receipt. Unit test verifies refund receipt content, type, email attachment, and retry behavior.

## Read endpoints

- [ ] TASK-pay-14: `GET /payments/:ref/receipt` endpoint
  - Context: FR4/FR5/FR6 — allow retrieval of persisted receipts by reference.
  - Deliverable: `apps/payment-service/src/main/java/com/modula/payment/controller/PaymentController.java` (extend), `apps/payment-service/src/test/java/com/modula/payment/controller/PaymentControllerTest.java`
  - Depends on: TASK-pay-9, TASK-pay-13
  - Assigned to: unassigned
  - Done criteria: `GET /payments/:ref/receipt` returns the receipt PDF for the given reference. Returns 404 if no receipt exists. Unit test covers successful retrieval and 404 case.

## Integration test

- [ ] TASK-pay-15: End-to-end integration test — full payment and refund lifecycle (PayPal sandbox)
  - Context: Validates the complete flow against PayPal sandbox: create order → capture → webhook confirmation → receipt generation → refund → refund receipt. Also tests: webhook signature validation, deduplication, idempotency on duplicate reference_id and refund_request_id. Uses PayPal sandbox credentials.
  - Deliverable: `apps/payment-service/src/test/java/com/modula/payment/PaymentIntegrationTest.java`
  - Depends on: TASK-pay-1 through TASK-pay-14
  - Assigned to: unassigned
  - Done criteria: All pass: integration.payment.createOrder.returnsPaymentLink, integration.payment.webhookConfirmation.updatesStatusToConfirmed, integration.payment.webhookConfirmation.generatesReceipts, integration.payment.webhookConfirmation.sendsReceiptEmail, integration.payment.webhook.deduplicatesByEventId, integration.payment.refund.processesRefundAndGeneratesReceipt, integration.payment.refund.idempotentOnDuplicateRequest, integration.payment.receipt.servesPdfUrl, integration.auditlog.allOperationsAreLogged. No PayPal sandbox calls are duplicated under retry conditions.
