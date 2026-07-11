# Design: Quote management (admin view)

## Endpoints (on the already-defined `Quote` domain)

- `GET /api/admin/quotes?status=&q=&dateFrom=&dateTo=&minAmount=&maxAmount=&page=`
- `GET /api/admin/quotes/:id` (includes status timeline, calculated from already-stored timestamps: `quote_sent_at`, `accepted_at`, `rejected_at`, etc.)
- `PATCH /api/admin/quotes/:id/postpone` `{ new_delivery_date, reason }` → triggers email to customer, complaint/refund still available.

## Frontend

- `views/QuotesTable` (tabs by status or status filter + search + pagination).
- `views/QuoteDetail` with visual timeline (reusable `TimelineStatus` component, candidate for `packages/` if reused in orders).
- `views/PostponeQuoteModal`.

## Design note

This feature depends functionally entirely on `feature-custom-quote` (same `Quote` domain) — its tasks must only execute after that feature's data model is migrated.
