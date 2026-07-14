# Tasks: Stock and supply management

- [ ] TASK-stock-1: Database migration + `Supply` entity with domain rules
  - Context: FR1 defines supply CRUD with fields name, SKU, unit, current quantity, minimum stock, unit cost, supplier. The `supplies`, `supply_stock_change_log`, and `low_stock_alert_state` tables must exist before any code. The entity enforces non-negative quantity as a business invariant.
  - Deliverable: `services/api-core/prisma/schema.prisma` (migration), `services/api-core/src/domain/supply/Supply.ts`, `services/api-core/src/domain/supply/SupplyStockChangeLog.ts`, `services/api-core/src/domain/supply/LowStockAlertState.ts`
  - Depends on: none
  - Assigned to: unassigned
  - Done criteria: `npx prisma migrate dev --name add-supplies` creates the three tables with correct columns/types. `Supply.create()` throws when `current_qty < 0`. `Supply.create()` accepts `current_qty = 0`. `SupplyStockChangeLog` stores source enum values `manual`, `excel_import`, `order_consumption`. Unit tests `unit.supply.quantityCannotBeNegative` and `unit.supply.quantityCanBeZero` pass.

- [ ] TASK-stock-2: CRUD endpoints `/admin/supplies` with search, filters, and pagination
  - Context: FR2 requires listing with search (by name/SKU), filters (by supplier, below-minimum), and pagination. FR1 requires full CRUD (create, read, update, delete) for supplies. Both manual editing from the panel and Excel import must use the same domain use case underneath.
  - Deliverable: `services/api-core/src/interface/http/controllers/SupplyController.ts`, `services/api-core/src/application/use-cases/supply/` (CreateSupply, UpdateSupply, DeleteSupply, ListSupplies), `services/api-core/src/infrastructure/prisma/repositories/SupplyRepository.ts`
  - Depends on: TASK-stock-1
  - Assigned to: unassigned
  - Done criteria: `GET /admin/supplies` returns paginated list with `?search=`, `?supplier=`, `?belowMin=true` query params. `POST /admin/supplies` creates a supply and returns 201. `PATCH /admin/supplies/:id` updates fields and logs change to `supply_stock_change_log`. `DELETE /admin/supplies/:id` removes supply. All endpoints return 400 on invalid input (negative quantity, missing required fields). Integration tests in `TASK-stock-10` verify full CRUD flow.

- [ ] TASK-stock-3: Excel parser with row-by-row validation + downloadable template + documentation
  - Context: FR3 requires bulk import via Excel with the defined format (`sku | name | unit | current_qty | min_stock | unit_cost_usd | supplier` as row 1 headers). Edge case: invalid rows (duplicate SKU, negative quantity, missing columns) must be reported row-by-row without aborting the entire file. Valid rows are applied and rejected rows are listed. The template must be downloadable from the panel and documented in `docs/supply-template.md`.
  - Deliverable: `services/api-core/src/application/use-cases/supply/ExcelParser.ts`, `services/api-core/src/application/use-cases/supply/__tests__/ExcelParser.spec.ts`, `services/api-core/src/interface/http/controllers/SupplyController.ts` (template download endpoint), `docs/supply-template.md`, `services/api-core/public/templates/supply-template.xlsx`
  - Depends on: TASK-stock-1
  - Assigned to: unassigned
  - Done criteria: `ExcelParser.parse(buffer)` returns `{ valid: Row[], errors: { row, field, message }[] }`. Duplicate SKU in same file produces error for the second occurrence. Negative `current_qty` produces a row-level error. Missing required column produces a file-level error. `GET /admin/supplies/template` returns the `.xlsx` file for download. `docs/supply-template.md` documents all columns, types, and example values. Unit tests `unit.supply.excel.duplicateSkuReportsError`, `unit.supply.excel.negativeQuantityReportsError`, `unit.supply.excel.missingColumnReportsError`, `unit.supply.excel.validRowsParsedCorrectly` pass.

- [ ] TASK-stock-4: `POST /admin/supplies/import-excel` endpoint (preview without applying)
  - Context: FR3 requires a preview step before applying changes. The endpoint parses the uploaded Excel, classifies each row as create (new SKU), update (existing SKU with changed data), or delete (SKU to remove), and returns the diff without persisting. This is the first entry point of the two-step import flow.
  - Deliverable: `services/api-core/src/application/use-cases/supply/ImportSupplyExcel.ts`, `services/api-core/src/interface/http/dto/ImportSupplyPreviewResponse.dto.ts`
  - Depends on: TASK-stock-2, TASK-stock-3
  - Assigned to: unassigned
  - Done criteria: `POST /admin/supplies/import-excel` (multipart) returns `{ previewId, toCreate: [], toUpdate: [], toDelete: [], errors: [] }`. New SKUs appear in `toCreate`. Existing SKUs with different data appear in `toUpdate`. No rows are persisted. Returns 400 for empty file or all-invalid rows. Integration tests in `TASK-stock-10` verify preview classification.

- [ ] TASK-stock-5: `POST /admin/supplies/import-excel/confirm` endpoint (apply + log)
  - Context: FR3 requires confirmation step that applies the previewed changes. All changes must be logged in `supply_stock_change_log` with `source = excel_import`. Consistency rule from non-functional requirements: manual editing and Excel import must use the same domain use case underneath.
  - Deliverable: `services/api-core/src/application/use-cases/supply/ConfirmSupplyImport.ts`
  - Depends on: TASK-stock-4
  - Assigned to: unassigned
  - Done criteria: `POST /admin/supplies/import-excel/confirm` with `{ previewId }` applies creates, updates, and deletes. Each applied change creates an entry in `supply_stock_change_log` with `source = excel_import`. Returns 400 for invalid/expired previewId. Returns `{ applied: number, errors: [] }`. Integration tests in `TASK-stock-10` verify confirm flow and log entries.

- [ ] TASK-stock-6: `GET /admin/supplies/export-excel` endpoint
  - Context: FR5 requires exporting the current supply state to Excel for offline work and re-import. The exported file must use the same column format as the import template so it can be re-imported without modification.
  - Deliverable: `services/api-core/src/application/use-cases/supply/ExportSupplyExcel.ts`
  - Depends on: TASK-stock-1, TASK-stock-3
  - Assigned to: unassigned
  - Done criteria: `GET /admin/supplies/export-excel` returns a valid `.xlsx` file with headers `sku | name | unit | current_qty | min_stock | unit_cost_usd | supplier`. All supplies from the database are included. The file can be re-imported via the import-excel endpoint without errors. Integration tests in `TASK-stock-10` verify export generates valid xlsx.

- [ ] TASK-stock-7: BullMQ job `hourly-low-stock-check` with anti-fatigue alert logic
  - Context: FR4 requires an automatic job every 1 hour that reviews all supplies where `current_quantity < minimum_stock` and triggers a non-binding informational notification via WebSocket to the admin panel with non-intrusive sound. Non-functional requirement: the same supply must not be re-notified if already viewed and did not drop further. Anti-fatigue rules from `on-low-stock-minimum.md`: notify if first time (`last_notified_at` is null), if worsened (`current_qty < last_notified_qty`), or if ≥24h since last notice.
  - Deliverable: `services/api-core/src/application/jobs/low-stock-check.job.ts`, `services/api-core/src/application/use-cases/supply/LowStockAlertState.ts` (update logic), `services/api-core/src/application/use-cases/supply/__tests__/LowStockAlertState.spec.ts`
  - Depends on: TASK-stock-1, feature-realtime-notifications
  - Assigned to: unassigned
  - Done criteria: Job iterates all supplies where `current_qty < min_stock`. For each, checks `LowStockAlertState`: emits notification if `last_notified_at` is null (first detection), or if `current_qty < last_notified_qty` (worsened), or if ≥24h since `last_notified_at`. Skips notification if already notified and no change. Updates `last_notified_at` and `last_notified_qty` after emitting. WebSocket event includes supply name, current quantity, minimum stock, timestamp. Unit tests `unit.lowStockAlert.notifiesOnFirstDetection`, `unit.lowStockAlert.notifiesWhenWorsened`, `unit.lowStockAlert.notifiesAfter24h`, `unit.lowStockAlert.skipsWhenAlreadyNotifiedAndUnchanged` pass.

- [ ] TASK-stock-8: `views/SuppliesTable` + `views/SupplyForm` + controllers
  - Context: FR1 and FR2 require a frontend for supply management. The admin must be able to create, edit, delete supplies and view a searchable, filterable, paginated table. Follows MVC convention: views are pure presentation, controllers orchestrate Model ↔ View.
  - Deliverable: `apps/admin-dashboard/src/views/SuppliesTable.tsx`, `apps/admin-dashboard/src/views/SupplyForm.tsx`, `apps/admin-dashboard/src/controllers/useSupplies.ts`, `apps/admin-dashboard/src/models/supplies.ts`
  - Depends on: TASK-stock-2
  - Assigned to: unassigned
  - Done criteria: `SuppliesTable` renders supply list with search input, supplier filter, below-minimum toggle, and pagination controls. `SupplyForm` handles create and edit modes with validation (non-negative quantity, required fields). `useSupplies` controller connects to API endpoints and manages local state. Mobile-first layout works at 360px viewport. Unit tests for `useSupplies` controller cover API call mocks and state transitions.

- [ ] TASK-stock-9: `views/ExcelImportWizard` with diff preview
  - Context: FR3 requires a frontend wizard for Excel import: upload file → preview detected changes (creates, modifications, deletes) with colored diffs → confirm. Follows MVC convention. The wizard must show row-by-row errors from the parser without blocking valid rows.
  - Deliverable: `apps/admin-dashboard/src/views/ExcelImportWizard.tsx`, `apps/admin-dashboard/src/controllers/useExcelImport.ts`
  - Depends on: TASK-stock-4, TASK-stock-5
  - Assigned to: unassigned
  - Done criteria: `ExcelImportWizard` shows file upload, then colored preview (green for create, yellow for update, red for delete), then confirm button. `useExcelImport` controller calls preview endpoint, manages preview state, and calls confirm endpoint. Errors are displayed per-row next to each item. Mobile-first layout works at 360px viewport. Unit tests for `useExcelImport` controller cover preview fetch, confirm call, and error state handling.

- [ ] TASK-stock-10: Integration tests for supply CRUD, Excel import/export, and alert logic
  - Context: Validates end-to-end flows that span multiple tasks: CRUD operations (create, read, update, delete with stock change log), Excel import preview/confirm flow (valid rows applied, invalid rows reported per-row without aborting), export generates re-importable xlsx, and low-stock alert anti-fatigue logic. Uses Supertest with test database.
  - Deliverable: `services/api-core/src/application/use-cases/supply/__tests__/supply.integration-spec.ts`
  - Depends on: TASK-stock-9
  - Assigned to: unassigned
  - Done criteria: `integration.supply.crud.createReadUpdateDelete` — create supply, read back, update with quantity change (verifies log entry), delete. `integration.supply.crud.listWithFilters` — list with search, supplier filter, below-min. `integration.supply.import.previewShowsToCreateToUpdateToDelete` — upload Excel with mix of new/existing/removed SKUs, verify preview classification. `integration.supply.import.validRowsAppliedInvalidRowsReported` — upload Excel with some invalid rows, confirm applies valid ones, errors list invalid ones. `integration.supply.import.confirmAppliesAndLogsChanges` — confirm creates log entries with `source = excel_import`. `integration.supply.export.generatesValidXlsx` — export produces valid xlsx that can be re-imported. `integration.supply.alert.firstDetectionTriggersNotification`, `integration.supply.alert.worsenedQtyTriggersNotification`, `integration.supply.alert.unchangedSkipsNotification`. All pass.
