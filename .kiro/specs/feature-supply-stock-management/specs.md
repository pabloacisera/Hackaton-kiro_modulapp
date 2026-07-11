# Specs: Stock and supply management

## Functional requirements

- FR1. CRUD for supplies: name, SKU, unit, current quantity, minimum stock, unit cost, supplier.
- FR2. Listing with search, filters (by supplier, by "below minimum") and pagination.
- FR3. **Bulk import/edit/delete via Excel template**: upload a file with the defined format, preview detected changes (creates, modifications, deletes) before confirming.
- FR4. Automatic job **every 1 hour** that reviews all supplies: if `current_quantity < minimum_stock`, triggers an alarm/notification (non-binding, informational only) to the admin panel, with non-intrusive sound.
- FR5. Export current supply state to Excel (for offline work and re-import).

## Non-functional requirements

- Manual editing from the panel and Excel import must maintain consistency (same domain use case underneath, two different entry points).
- The same supply below minimum must not be re-notified in each hourly run if it was already "viewed" and did not drop further (see `hooks/on-low-stock-minimum.md`).

## Edge cases

- Excel with invalid rows (duplicate SKU, negative quantity, missing columns) → reports row-by-row what failed, without aborting the entire file; valid rows are applied and rejected rows are listed.
- A supply is edited simultaneously from the panel and by an ongoing Excel import → last write wins, but who/when is audited (stock change log).

## Acceptance criteria

- Uploading an Excel with 1 invalid row does not block loading of other valid rows.
- The below-minimum stock alarm reaches the admin within the hour the stock crossed the threshold.
