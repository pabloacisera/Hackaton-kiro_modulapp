# Specs: Payment and billing microservice (Java/Spring Boot)

## What it is

Isolated service responsible for **all** financially-sensitive operations in the system: initiating payments via PayPal, processing refunds, and generating/sending receipts (non-fiscal tickets) to both the customer and admin. Java/Spring Boot is chosen for its robustness in these critical operations.

> Note for the team: this is the project's first Java service. See `docs/java-springboot-guide.md` for onboarding.

## Functional requirements

- FR1. Initiate a payment (direct purchase or accepted quote order): receives `{ reference_id, amount_usd, customer_email, origin: 'order'|'quote' }`, creates a payment order in PayPal, returns `payment_link`.
- FR2. Receive PayPal's native webhook (IPN/webhook v2) to confirm payment result, and notify `api-core` via its own webhook.
- FR3. Execute automatic refund (PayPal Refunds API) when `api-core` requests it (order rejection, or approved complaint).
- FR4. Generate a receipt (simple PDF, non-fiscal) for each successful payment: one addressed to the customer (with amount, concept, date) and one addressed to the admin (same content + internal reference).
- FR5. Send the customer's receipt by email automatically upon payment confirmation. Persist copies of both receipts.
- FR6. Generate an equivalent receipt for an executed refund (for customer and admin).

## Non-functional requirements

- **Mandatory idempotency**: retrying "initiate payment" or "refund" with the same `reference_id`/`refund_request_id` must not duplicate the charge/refund.
- All money operations are logged in an immutable audit log (who requested, when, PayPal result, amount).
- Amounts are handled with `BigDecimal`, never `float`/`double`.
- This service has its own database schema — it does not share tables directly with `api-core` (communication only via HTTP/webhooks).

## Edge cases

- PayPal responds with error/timeout when initiating payment → clear error returned to `api-core`, no receipt created and nothing marked as paid.
- PayPal webhook arrives duplicated (PayPal may resend) → deduplicated by `paypal_event_id`, each event processed only once.
- A refund is requested twice for the same payment (due to `api-core` retry after timeout) → must detect that a refund already exists for that reference and return the existing result, without refunding twice.
- Receipt email sending fails → the receipt is already persisted anyway; sending is retried (the receipt is not lost due to a mail failure).

## Acceptance criteria

- No payment or refund can be executed twice for the same reference, under any retry or unstable network condition.
- Every successful payment has a persisted receipt before being considered "complete" internally.
