# Design: Payment and billing microservice (Java/Spring Boot)

## Why Java/Spring Boot (for those who have never worked with this)

- Spring Boot provides, "out of the box", declarative transactions (`@Transactional`), strong typing and a mature ecosystem for idempotency and error handling — ideal for isolating the code that moves real money from the rest of the system. Think of it as "a separate safe": it only talks HTTP to the rest, never shares a database or code.
- Typical Spring Boot project structure:
  ```
  src/main/java/com/company/payment/
    controller/    // receives HTTP (equivalent to Nest controllers)
    service/       // business logic (equivalent to application/use-cases)
    domain/        // entities (equivalent to domain/)
    repository/    // data access (Spring Data JPA, equivalent to an ORM)
    config/        // configuration (security, PayPal SDK, etc.)
  ```
- Run with Maven or Gradle (Maven recommended for being simpler to read for beginners); `docs/java-springboot-guide.md` documents the step-by-step for local build and startup.

## Data model (payment-service, own)

```
Payment {
  id: uuid
  reference_id: string        // order_id or quote_id from api-core
  origin: enum(order, quote)
  amount_usd: decimal
  status: enum(initiated, confirmed, failed, refunded)
  paypal_order_id: string
  idempotency_key: string (unique)
  created_at, confirmed_at
}
Refund {
  id: uuid
  payment_id: uuid (FK)
  refund_request_id: string (unique)   // idempotency key from api-core side
  paypal_refund_id: string
  reason: text
  status: enum(processed, failed)
  created_at
}
Receipt {
  id: uuid
  payment_id: uuid | null
  refund_id: uuid | null
  audience: enum(customer, admin)
  pdf_url: string          // storage (Supabase storage)
  sent_at: timestamp | null
}
AuditLog {
  id, actor, action, reference_id, payload_json, result, created_at
}
```

## Endpoints

- `POST /payments/orders` `{ reference_id, origin, amount_usd, customer_email, idempotency_key }`
  → creates `Payment(initiated)`, creates order in PayPal Orders API, returns
  `{ payment_link, payment_service_ref }`. If a `Payment` with that `idempotency_key` already exists, returns the existing one without creating a new one.
- `POST /payments/webhooks/paypal` (PayPal native webhook) → validates signature, deduplicates by `paypal_event_id`, updates `Payment` to `confirmed`/`failed`, generates `Receipt` (customer + admin) if confirmed, calls `api-core` webhook (`/orders/webhooks/payment-result` or the quotes one).
- `POST /payments/orders/:ref/refund` `{ reason, refund_request_id }` → if a `Refund` with that `refund_request_id` already exists, returns the existing one. If not, calls PayPal Refunds API, creates `Refund`, generates refund `Receipt`.
- `GET /payments/:ref/receipt` → serves the PDF (or its signed URL).

## Idempotency

Every financial write operation requires an `idempotency_key` / `refund_request_id` provided by the caller (`api-core`), generated once per business attempt (not per HTTP retry). It is persisted with a `UNIQUE` constraint in DB — the second attempt with the same key is a no-op that returns the already-existing result.

## Receipt generation

Simple PDF (library like `iText` or `OpenPDF`) with: date, concept (prototype or quote description), USD amount, internal reference, and notice of "internal receipt — not valid as a fiscal invoice". It is stored in storage before attempting to send by email (to not lose the receipt if sending fails).
