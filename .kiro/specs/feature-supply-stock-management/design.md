# Design: Stock and supply management

## Data model

```
Supply {
  id: uuid
  sku: string (unique)
  name: string
  unit: string          // e.g.: "unit", "m2", "kg"
  current_qty: decimal
  min_stock: decimal
  unit_cost_usd: decimal
  supplier: string | null
  updated_at
}
SupplyStockChangeLog {
  id, supply_id, previous_qty, new_qty, source: enum(manual, excel_import, order_consumption),
  actor, created_at
}
LowStockAlertState {
  supply_id, last_notified_at, last_notified_qty
}
```

## Excel template (columns)

`sku | name | unit | current_qty | min_stock | unit_cost_usd | supplier`
(exact header, row 1). Documented and versioned in `docs/supply-template.md` with a downloadable `.xlsx` example from the panel.

## Endpoints

- `GET/POST/PATCH/DELETE /api/admin/supplies` (CRUD + listing with filters/pagination).
- `POST /api/admin/supplies/import-excel` (multipart) → parses, validates row by row, returns preview `{ toCreate, toUpdate, toDelete, errors }` without applying.
- `POST /api/admin/supplies/import-excel/confirm` `{ previewId }` → applies valid changes from preview.
- `GET /api/admin/supplies/export-excel` → generates current `.xlsx`.

## BullMQ job — hourly check

`hourly-low-stock-check`: iterates `Supply` where `current_qty < min_stock`. For each, decides whether to notify based on `LowStockAlertState`: notifies if `last_notified_at` is null, if `current_qty < last_notified_qty` (worsened), or if ≥24h have passed since the last notice. Emits WebSocket event with sound (see `feature-realtime-notifications`).

## Frontend

- `views/SuppliesTable` (search, filters, pagination), `views/SupplyForm`, `views/ExcelImportWizard` (upload → preview with colored diffs → confirm).
