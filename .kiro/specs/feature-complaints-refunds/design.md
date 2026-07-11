# Design: Complaints and refunds

## Data model

```
Complaint {
  id: uuid
  reference_type: enum(order, quote, unknown)
  reference_id: uuid | null
  customer_name, customer_email, customer_phone
  reason: text
  status: enum(received, under_review, refund_approved, resolved_other_way, rejected)
  resolution_notes: text | null
  refund_request_id: string | null   // idempotency key to payment-service
  created_at, resolved_at
}
```

## Endpoints

- `POST /api/complaints` (public) → creates `Complaint(received)`, sends complaint receipt to customer (email with reference number = `id`), notifies admin.
- `GET /api/admin/complaints?status=&q=&page=`.
- `PATCH /api/admin/complaints/:id/approve-refund` → if `reference_type` is `unknown` or `reference_id` is null, rejects with a clear error (no payment to refund — the admin must use `resolve` with a non-refund resolution instead). Otherwise, generates unique `refund_request_id`, calls `payment-service` `.../refund`, updates status based on result.
- `PATCH /api/admin/complaints/:id/resolve` `{ resolution_notes, status }` → for non-refund resolutions.

## Frontend

- `apps/landing`: `views/ComplaintForm` ("Complaints and refunds" section always visible in nav).
- `apps/admin-dashboard`: `views/ComplaintsTable` + `views/ComplaintDetail` with "Approve refund" button (shows explicit error if `payment-service` responds that a refund already exists for that reference).
