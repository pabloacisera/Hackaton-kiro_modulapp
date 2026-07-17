# Tasks: Order management and delivery schedule

- [ ] TASK-delivery-1: SQL view/projection `DeliveryItem` (UNION orders+quotes)
  - Context: FR1, FR3, NFR — a single pending work view must display homogeneously items from `Order` (Flow A) and `Quote` (Flow B). The delivery time counter starts at acceptance (Flow A) or confirmed payment (Flow B). Requires a common projection model via a SQL view/projection that UNIONs accepted orders and paid quotes with correct `estimated_delivery_date` calculation.
  - Deliverable: `apps/api-core/src/modules/deliveries/delivery-item.model.ts`, `apps/api-core/src/modules/deliveries/delivery-item.query.ts`
  - Depends on: TASK-directpurchase-2, TASK-quoteB-2
  - Assigned to: unassigned
  - Done criteria: SQL projection returns rows from both `Order` (status=accepted) and `Quote` (status=paid). Each row includes `origin`, `id`, `customer_name`, `estimated_delivery_date`, `status`, `delivered_at`. `estimated_delivery_date` is calculated from `accepted_at` (Order) or `paid_at` (Quote). Non-deliverable statuses are excluded. Unit tests in `apps/api-core/src/modules/deliveries/delivery-item.spec.ts` pass: projection merges orders and quotes, overdue logic (today > estimated_delivery_date and status != delivered) is correct, deliver sets `delivered_at`, postpone updates `estimated_delivery_date`.

- [ ] TASK-delivery-2: `GET /admin/deliveries` endpoint with filters/search/pagination
  - Context: FR1 — pending, completed, delivered listings with search/filter/pagination for the unified delivery schedule view.
  - Deliverable: `apps/api-core/src/modules/deliveries/deliveries.controller.ts`, `apps/api-core/src/modules/deliveries/deliveries.service.ts`
  - Depends on: TASK-delivery-1
  - Assigned to: unassigned
  - Done criteria: `GET /admin/deliveries` accepts query params `status` (pending|completed|delivered), `search` (customer name), `page`, `limit`. Returns paginated `DeliveryItem[]` with `total` count. Items are sorted by `estimated_delivery_date` ASC by default. Unit tests in `apps/api-core/src/modules/deliveries/deliveries.service.spec.ts` pass: filters by status, searches by customer name, paginates correctly, defaults sort order.

- [ ] TASK-delivery-3: `PATCH /admin/deliveries/:origin/:id/deliver` endpoint
  - Context: FR4 — mark an order as delivered, closing the delivery time counter.
  - Deliverable: `apps/api-core/src/modules/deliveries/deliveries.controller.ts` (route addition), `apps/api-core/src/modules/deliveries/deliveries.service.ts` (method addition)
  - Depends on: TASK-delivery-1
  - Assigned to: unassigned
  - Done criteria: `PATCH /admin/deliveries/:origin/:id/deliver` sets `delivered_at` to current timestamp and updates status to `delivered` on the underlying `Order` or `Quote` depending on `origin`. Returns updated `DeliveryItem`. Rejects if already delivered. Unit tests in `apps/api-core/src/modules/deliveries/deliveries.service.spec.ts` pass: deliver sets `delivered_at`, idempotent reject on already-delivered, correct origin routing.

- [ ] TASK-delivery-4: `PATCH /admin/deliveries/:origin/:id/postpone` endpoint
  - Context: FR5 — postpone delivery date, notifying the customer by email (reuses email mechanism from `feature-quote-management-admin` for Flow B; for Flow A it is equivalent on `Order`).
  - Deliverable: `apps/api-core/src/modules/deliveries/deliveries.controller.ts` (route addition), `apps/api-core/src/modules/deliveries/deliveries.service.ts` (method addition)
  - Depends on: TASK-delivery-1
  - Assigned to: unassigned
  - Done criteria: `PATCH /admin/deliveries/:origin/:id/postpone` accepts `{ estimated_delivery_date: string }` body, updates the field on the underlying `Order` or `Quote`, and triggers a customer email notification. Returns updated `DeliveryItem`. Rejects if already delivered. Unit tests in `apps/api-core/src/modules/deliveries/deliveries.service.spec.ts` pass: postpone updates `estimated_delivery_date`, email notification is triggered, reject on already-delivered.

- [ ] TASK-delivery-5: `views/DeliveriesBoard` + `views/DeliveriesTable` (combined frontend views)
  - Context: FR1, FR2 — pending deliveries schedule displayed as a calendar/list view (DeliveriesBoard) and a tabular view (DeliveriesTable), both consuming the same `GET /admin/deliveries` endpoint. Overdue items (past `estimated_delivery_date` and not delivered) are visually highlighted.
  - Deliverable: `src/views/DeliveriesBoard.vue`, `src/views/DeliveriesTable.vue`, `src/composables/useDeliveries.ts`
  - Depends on: TASK-delivery-2
  - Assigned to: unassigned
  - Done criteria: DeliveriesBoard renders a calendar/list layout sorted by `estimated_delivery_date`. DeliveriesTable renders a sortable table with columns for customer, origin, estimated date, status. Both views share a composable (`useDeliveries`) that calls `GET /admin/deliveries` with filters/pagination. Overdue items have a visual indicator (e.g., red highlight or badge). Frontend unit tests in `src/views/__tests__/DeliveriesBoard.spec.ts` and `src/views/__tests__/DeliveriesTable.spec.ts` pass: board renders items sorted by date, table renders rows with correct columns, overdue highlight appears when date is past, composable handles loading/error/pagination states.

- [ ] TASK-delivery-integration: Integration tests for DeliveryItem projection and actions
  - Context: End-to-end validation that the UNION query correctly merges accepted orders and paid quotes into `DeliveryItem`, and that all actions (list, deliver, postpone) work against a real test database. Covers edge cases: overdue calculation, filtering, pagination, status transitions.
  - Deliverable: `apps/api-core/src/modules/deliveries/**/*.integration-spec.ts`
  - Depends on: TASK-delivery-4, TASK-delivery-5
  - Assigned to: unassigned
  - Done criteria: Integration tests pass against a seeded test DB containing orders and quotes in various states. Covers: `integration.delivery.projection.includesAcceptedOrders`, `integration.delivery.projection.includesPaidQuotes`, `integration.delivery.projection.excludesNonDeliverableStatuses`, `integration.delivery.list.filterByStatus`, `integration.delivery.list.pagination`, `integration.delivery.overdue.calculatedCorrectly`, `integration.delivery.deliver.setsDeliveredAt`, `integration.delivery.postpone.updatesEstimatedDate`. All assertions green.
