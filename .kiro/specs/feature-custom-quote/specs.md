# Specs: Custom quote (Flow B)

## What it is

The customer describes what they need (no predefined prototype), the admin quotes checking stock/supplies, and the customer accepts or rejects by email within fixed time windows.

## Functional requirements

- FR1. Request form with: name, email, phone (**all 3 mandatory**), detailed description of what is needed, date/deadline when it is needed.
- FR2. If name, email or phone is missing → the system may discard the request and **must notify the admin** of that discard (with what was received, so the admin can decide if they still want to contact manually).
- FR3. Valid request → status `pending`. Confirmation email is sent to customer ("we received your request, status: pending") and admin is notified.
- FR4. Admin reviews the request, checks available stock/supplies, and from the dashboard clicks "Present quote": enters price (USD) and approximate execution time. This:
  - Sends quote email to customer with two buttons: **Accept** / **Reject**.
  - The customer has **48 hours** to respond.
- FR5. If the customer **rejects** → admin is notified to archive or delete the quote.
- FR6. If the customer **accepts** → the API returns/generates a payment link (PayPal), with a maximum window of **24 hours** to pay. After that deadline without payment, that link can no longer be used — a new quote must be requested.
- FR7. If the customer **does not respond within 48 hours** (neither accepts nor rejects) → an automatic job marks the quote as `expired`; the admin must archive or delete it manually (no auto-cleanup).
- FR8. Payment made within the deadline → admin is notified of the completed payment and **the delivery time counter starts** (`feature-order-delivery-schedule`).
- FR9. Payment always generates a receipt (customer + admin), via `feature-payment-billing-java`.
- FR10. The admin can postpone an already-agreed delivery date, notifying the customer by email; complaint/refund tools remain available to the customer.

## Non-functional requirements

- The "Accept"/"Reject" buttons in the email must work without the customer needing to create an account — they are signed links (token with expiration) pointing to a public API endpoint.
- An accept/reject link used once must not be reusable (idempotency and prevention of double-click / email re-send).

## Edge cases

- Customer clicks "Accept" but the link already expired (past 48 hours) → show a clear "this quote expired, request a new one" page, without processing the acceptance.
- Customer clicks "Accept" twice (double-click, or email re-sent by them) → second time must be a safe no-op, showing the current state, not a second different payment link.
- Customer pays but after 24 hours due to PayPal delay (payment initiated before expiration but confirmed after) → define tolerance: the **payment initiation time** within the link is considered, not the confirmation time, to not penalize gateway delays.
- Admin quotes but stock changes before customer pays → stock is not revalidated automatically in this flow (the commitment is custom manufacturing, not finished product stock); if the admin cannot fulfill, they use the postponement/complaint path.

## Acceptance criteria

- No accept/reject link is reusable or works past its expiration.
- Any request without complete name/email/phone never reaches a `pending` status visible for quoting.
