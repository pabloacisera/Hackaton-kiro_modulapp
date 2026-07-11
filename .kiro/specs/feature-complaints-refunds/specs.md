# Specs: Complaints and refunds

## Functional requirements

- FR1. Public form on the landing (always visible section) where the customer requests a refund or files a complaint: order/quote reference (or contact data if they don't have it on hand), reason, description.
- FR2. On submission, the admin is notified by email and a **complaint receipt** is sent to the customer by email (proof that the complaint was received, with a reference number).
- FR3. Admin reviews and decides: approve refund (triggers automatic refund via `feature-payment-billing-java`) or resolve another way (e.g., replacement, contacting the customer) with a record of the resolution.
- FR4. Complaint history per customer/order visible in the admin.

## Non-functional requirements

- The complaint receipt is always sent, regardless of whether the refund is later approved or not — it is proof of receipt, not of resolution.

## Edge cases

- Customer requests a refund without a valid order reference (lost it or made a mistake) → the complaint is still registered with the contact data, the admin investigates manually.
- Refund approved on a payment that was already refunded before (via another path) → `payment-service` must reject the duplicate (see idempotency in `feature-payment-billing-java`), and the admin UI must show that error clearly, not as success.

## Acceptance criteria

- Every submitted complaint generates a receipt to the customer without exception.
- No refund is executed twice on the same payment.
