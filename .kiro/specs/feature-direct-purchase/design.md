# Design: Direct purchase (Flow A)

## Order state machine (`Order`)

```
created
  → payment_initiated          (called payment-service, waiting for PayPal)
      → paid_pending_acceptance   (payment webhook OK)
          → accepted        (admin accepts; deducts stock; sets delivery ETA)
          → rejected        (admin rejects; triggers automatic refund)
      → payment_failed        (payment webhook failed / customer abandoned)
```

## Data model (api-core, `orders` domain)

```
Order {
  id: uuid
  prototype_id: uuid
  price_usd_snapshot: decimal(10,2)   // price read server-side at payment time
  customer_email: string
  customer_name: string | null
  status: enum(created, payment_initiated, paid_pending_acceptance, accepted, rejected, payment_failed)
  rejection_reason: text | null
  estimated_delivery_date: date | null
  payment_service_ref: string   // transaction ID returned by payment-service
  created_at, updated_at
}
```

## api-core endpoints

- `POST /api/orders` `{ prototype_id, customer_email }` → re-reads price/stock, validates `build_on_demand` if stock 0, creates `Order` in `created`, calls `payment-service` to initiate payment, returns `payment_link`/`order_id`.
- `POST /api/orders/webhooks/payment-result` (called by payment-service) → transitions `payment_initiated` → `paid_pending_acceptance` or `payment_failed`, triggers confirmation email + WebSocket notification to admin.
- `PATCH /api/orders/:id/accept` `{ estimated_delivery_date }` (admin, JWT) → deducts stock, transitions to `accepted`, triggers receipt generation.
- `PATCH /api/orders/:id/reject` `{ reason }` (admin, JWT) → transitions to `rejected`, calls `payment-service` for automatic refund, notifies customer.
- `GET /api/orders?status=&q=&page=` (admin) → listing with search/filter/pagination.

## Reconciliation job (BullMQ)

Every 5 min, finds `Order` in `payment_initiated` older than 10 min and checks actual status against `payment-service` (which in turn checks PayPal), to cover missed webhooks.

## Contract with payment-service (Java)

- `api-core` → `payment-service`: `POST /payments/orders` `{ order_id, amount_usd, customer_email }`
  → returns `{ payment_link, payment_service_ref }`.
- `payment-service` → `api-core` (webhook): `POST /api/orders/webhooks/payment-result`
  `{ order_id, payment_service_ref, status: 'ok'|'failed' }`.
- `api-core` → `payment-service` (refund): `POST /payments/orders/:ref/refund`
  `{ reason }`.

## Cross-feature dependencies
- Depends on: feature-payment-billing-java (status: not-started)
- If not merged: work against the mocked contract defined in this design.md (§Contract with payment-service). Replace HTTP calls with a thin adapter that can be swapped once the real microservice exists.
