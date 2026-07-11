# Specs: Direct purchase (Flow A)

## What it is

Purchase flow for an already-quoted prototype: the customer pays first, and only then the admin accepts or rejects the order.

## Functional requirements

- FR1. Customer selects prototype → goes directly to payment gateway (PayPal), no account needed.
- FR2. Before creating the payment order, the system **re-reads current price and stock** from the DB (does not trust what the customer saw on screen).
- FR3. If payment is successful:
  - Confirmation email is sent to the customer (mandatory: without a valid email the payment cannot be executed) with estimated wait time if applicable.
  - Admin is notified in real-time (WebSocket) of a new purchase pending acceptance.
  - Order remains in `paid_pending_acceptance` status. **Stock is not deducted yet.**
- FR4. Admin, from the dashboard, **accepts** or **rejects** the order:
  - Accept → must set an estimated delivery time. Stock is deducted only now.
  - Reject → mandatory justification. Triggers automatic refund (PayPal Refunds API) and notifies customer by email. No stock deduction.
- FR5. Every payment automatically generates a receipt (non-fiscal) — one for the customer and one for the admin — via `feature-payment-billing-java`.

## Non-functional requirements

- Customer email is mandatory and format is validated before allowing payment (no double opt-in confirmation needed, but valid format is required).
- All payment logic lives in `payment-service` (Java) — `api-core` only orchestrates the "initiate payment" request and receives the result webhook.

## Edge cases

- Stock reaches 0 between customer viewing the price and confirming payment → if `build_on_demand` is `true`, it is allowed anyway (remains "on order"); if `false` and stock is 0, payment is blocked with a clear message before reaching PayPal.
- Successful payment on PayPal but confirmation webhook does not reach `api-core` (network failure) → reconciliation job that checks actual status on PayPal every X minutes for orders in `payment_initiated` status without confirmation.
- Admin never responds (neither accepts nor rejects) → no automatic expiration defined yet for Flow A (see open question in `docs/roadmap.md`); for now the order remains visible as indefinitely pending on the dashboard until manual action.

## Acceptance criteria

- A successful payment never deducts stock before admin acceptance.
- An admin rejection always results in a confirmed and registered automatic refund.
