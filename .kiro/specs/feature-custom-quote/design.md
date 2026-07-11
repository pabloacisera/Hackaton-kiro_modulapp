# Design: Custom quote (Flow B)

## State machine (`Quote`)

```
discarded_incomplete_data   (never visible for quoting; admin notification only)
pending
  → quoted            (admin presented price + deadline; email sent with token)
      → accepted         (customer clicks "Accept" within 48h)
          → payment_initiated
              → paid     (within 24h window from "accepted")
              → payment_expired (24h passed without payment initiated on time)
      → rejected        (customer clicks "Reject")
      → expired          (job: 48h passed without any click)
  archived / deleted  (manual admin action on rejected/expired/payment_expired)
```

## Data model (api-core, `quotes` domain)

```
Quote {
  id: uuid
  customer_name: string
  customer_email: string
  customer_phone: string
  description: text
  needed_by_date: date
  status: enum(pending, quoted, accepted, rejected, expired, payment_initiated, paid, payment_expired, archived)
  quoted_price_usd: decimal(10,2) | null
  quoted_lead_time_days: int | null
  quote_sent_at: timestamp | null
  quote_response_deadline: timestamp | null   // quote_sent_at + 48h
  payment_deadline: timestamp | null           // accepted_at + 24h
  accepted_at, rejected_at, paid_at: timestamp | null
  rejection_reason: text | null                // if system discards due to incomplete data
  action_token_hash: string | null             // hash of the accept/reject link token
  action_token_used: boolean
  payment_service_ref: string | null
}
```

## Action tokens (magic links)

- When sending the quote, a signed one-time-use JWT is generated:
  `{ quote_id, action: 'pending', exp: quote_response_deadline }`.
- `GET /api/quotes/:id/accept?token=...` and `GET /api/quotes/:id/reject?token=...`:
  1. Verifies signature and expiration.
  2. Verifies `action_token_used === false` (if already used, responds with "this was already processed" page showing current state, without re-executing).
  3. Sets `action_token_used = true` in the same transaction as the status change (prevents double-click / race condition).

## Endpoints

- `POST /api/quotes` (public) — validates name/email/phone; if anything is missing, does not create a `pending` Quote, creates a `discarded_incomplete_data` record and notifies the admin.
- `PATCH /api/quotes/:id/present` (admin, JWT) `{ price_usd, lead_time_days }` → moves to `quoted`, generates token, sends email with buttons.
- `GET /api/quotes/:id/accept?token=` (public) → moves to `accepted`, calls `payment-service` to generate payment link with `payment_deadline`.
- `GET /api/quotes/:id/reject?token=` (public) → moves to `rejected`, notifies admin.
- `GET /api/quotes?status=&q=&page=` (admin) — listing with filters.
- `PATCH /api/quotes/:id/archive` (admin) — from `rejected`/`expired`/`payment_expired`.

## BullMQ jobs

- `quote-expiration-check`: runs periodically, finds `quoted` with `quote_response_deadline` expired → moves to `expired`, notifies admin (does not auto-archive).
- `quote-payment-expiration-check`: finds `accepted`/`payment_initiated` with `payment_deadline` expired and no `paid_at` → moves to `payment_expired`, notifies admin.

## Frontend

- `apps/landing`: `views/QuoteRequestForm` (controller validates the 3 mandatory fields client-side, but real validation is server-side).
- Simple public pages (without full landing layout) for `/quotes/:id/accept` and `/reject` result — show final state or expired/used link error.

## Cross-feature dependencies
- Depends on: feature-payment-billing-java (status: not-started)
- If not merged: work against the mocked contract defined in `feature-direct-purchase/design.md` §Contract with payment-service. The payment initiation and refund calls use the same endpoints; swap the adapter once the real microservice exists.
