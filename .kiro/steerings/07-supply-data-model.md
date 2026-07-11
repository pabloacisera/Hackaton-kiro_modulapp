# Supply data model

Template for documenting supplies used in the manufacturing process.

## Supply data model

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | UUID | auto | Unique identifier |
| `name` | string | yes | Supply name (e.g., "MDF Sheet 15mm") |
| `description` | string | no | Detailed description |
| `unit` | enum | yes | `sheet`, `meter`, `kilogram`, `unit` |
| `unit_cost` | decimal | yes | Cost per unit in USD |
| `current_stock` | integer | yes | Current quantity in stock |
| `minimum_stock` | integer | yes | Minimum stock before alert |
| `supplier` | string | no | Supplier name |
| `lead_time_days` | integer | no | Days to restock |
| `created_at` | timestamp | auto | Creation date |
| `updated_at` | timestamp | auto | Last update date |

## Stock management rules

- Stock is deducted when an order is **accepted** by the admin (Flow A).
- Stock is NOT deducted when a quote is created (Flow B) — only when payment is confirmed.
- Minimum stock alerts are checked hourly via BullMQ job.
- When stock reaches minimum, admin receives a WebSocket notification.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/supplies` | List all supplies |
| GET | `/api/supplies/:id` | Get supply by ID |
| POST | `/api/supplies` | Create new supply (admin) |
| PATCH | `/api/supplies/:id` | Update supply (admin) |
| DELETE | `/api/supplies/:id` | Delete supply (admin) |
| GET | `/api/supplies/low-stock` | Get supplies below minimum |
