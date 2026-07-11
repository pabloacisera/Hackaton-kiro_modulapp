# Design: Order management and delivery schedule

## Unified projection model

Instead of duplicating logic, a read-only view (SQL view or calculated projection in the use case) `DeliveryItem` is created:

```
DeliveryItem {
  id                  // order_id or quote_id
  origin: enum(order, quote)
  customer_name, customer_email
  estimated_delivery_date
  status: enum(pending, delivered, overdue)  // "overdue" is calculated: today > estimated_delivery_date and status != delivered
  delivered_at: timestamp | null
}
```

It is built with a `UNION` between `orders` (status `accepted`) and `quotes` (status `paid`), exposed through a single endpoint so the frontend does not need to know the origin to render the schedule.

## Endpoints

- `GET /api/admin/deliveries?status=&q=&page=` → uses the unified projection.
- `PATCH /api/admin/deliveries/:origin/:id/deliver` → sets `delivered_at`, on `Order` or `Quote` depending on `origin`.
- `PATCH /api/admin/deliveries/:origin/:id/postpone` → reuses the same mechanism from `feature-quote-management-admin` for `Quote`, and equivalent new one for `Order`.

## Frontend

- `views/DeliveriesBoard` (list/calendar sorted by date, with overdue visual indicator).
- `views/DeliveriesTable` (search/filter/pagination, alternative tabular view).
