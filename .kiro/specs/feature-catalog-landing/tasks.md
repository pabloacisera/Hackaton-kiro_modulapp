# Tasks: Public catalog on landing

- [ ] TASK-catalog-1: Database migration + `Prototype` domain entity with invariants
  - Context: FR1 — data model for active prototypes; entity enforces `active implies visible` and `stock_qty >= 0` (FR14 — `build_on_demand` allows stock=0 purchase)
  - Deliverable: Prisma migration for `prototypes` + `proto_images` tables, `services/api-core/src/modules/catalog/domain/prototype.entity.ts`
  - Depends on: none
  - Assigned to: unassigned
  - Done criteria: migration runs cleanly on dev DB; unit tests pass for `activeImpliesVisible`, `stockQtyCannotBeNegative`, and `buildOnDemandAllowsZeroStock`

- [ ] TASK-catalog-2: `GET /catalog/prototypes` and `GET /catalog/prototypes/:id` endpoints
  - Context: FR1 — list active prototypes with images/name/description/price/stock; FR2 — filter by category and price range; FR3 — search by name/description; FR4 — prototype detail with gallery and specs
  - Deliverable: `services/api-core/src/modules/catalog/use-cases/list-prototypes.ts`, `services/api-core/src/modules/catalog/use-cases/get-prototype.ts`, `services/api-core/src/modules/catalog/controllers/catalog.controller.ts`, `services/api-core/src/modules/catalog/catalog.module.ts`
  - Depends on: TASK-catalog-1
  - Assigned to: unassigned
  - Done criteria: unit tests pass for list use case (category filter, price range, search, combined filters, pagination) and detail use case (valid ID returns full prototype, invalid ID returns 404)

- [ ] TASK-catalog-3: Redis cache for listings with invalidation on update
  - Context: non-functional — cache catalog listings for performance; invalidate on admin update
  - Deliverable: `services/api-core/src/modules/catalog/cache/catalog-cache.service.ts`, integration in `catalog.controller.ts`
  - Depends on: TASK-catalog-2
  - Assigned to: unassigned
  - Done criteria: unit tests pass for cache hit returns cached data, cache invalidation clears listing cache on update

- [ ] TASK-catalog-4: SSE endpoint `/catalog/stream` + event publisher from admin catalog module
  - Context: FR6 — real-time sync so landing page reflects price/stock/deactivation changes without reload
  - Deliverable: `services/api-core/src/modules/catalog/controllers/catalog-sse.controller.ts`, `services/api-core/src/modules/catalog/events/catalog-event.publisher.ts`, registration in `catalog.module.ts`
  - Depends on: TASK-catalog-1
  - Assigned to: unassigned
  - Done criteria: unit tests pass for SSE connection establishment and event emission on prototype update/deactivation

- [ ] TASK-catalog-5: `models/catalogApi.ts` + `controllers/useCatalog.ts` in `apps/landing`
  - Context: FR1–FR4, FR6, edge case — SSE connection drops require automatic reconnection with backoff without losing last data snapshot; non-functional — mobile-first, responsive
  - Deliverable: `apps/landing/src/models/catalogApi.ts`, `apps/landing/src/controllers/useCatalog.ts`
  - Depends on: TASK-catalog-2, TASK-catalog-4
  - Assigned to: unassigned
  - Done criteria: unit tests pass for fetch with combined filters, EventSource SSE parsing, reconnection backoff logic, and state merge on incoming events

- [ ] TASK-catalog-6: `CatalogGrid` + `PrototypeCard` views
  - Context: FR1 — display prototypes with image, name, description, price, stock status; non-functional — mobile-first responsive layout
  - Deliverable: `apps/landing/src/views/CatalogGrid.tsx`, `apps/landing/src/views/PrototypeCard.tsx`
  - Depends on: TASK-catalog-5
  - Assigned to: unassigned
  - Done criteria: unit tests pass for rendering grid with mock data, card displays all required fields, responsive breakpoint behavior

- [ ] TASK-catalog-7: `PrototypeDetail` view + image gallery
  - Context: FR4 — view prototype detail with gallery, specifications, estimated delivery; FR5 — buy button leads to Flow A
  - Deliverable: `apps/landing/src/views/PrototypeDetail.tsx`, `apps/landing/src/views/ImageGallery.tsx`
  - Depends on: TASK-catalog-5
  - Assigned to: unassigned
  - Done criteria: unit tests pass for detail render with all fields, gallery navigation, buy button presence

- [ ] TASK-catalog-8: `CatalogFilters` view + deactivation notice
  - Context: FR2 — filter by category/price; FR3 — search by name/description; edge case — prototype deactivated while detail page open shows "no longer available" via SSE without allowing buy
  - Deliverable: `apps/landing/src/views/CatalogFilters.tsx`, deactivation notice component in `PrototypeDetail.tsx`
  - Depends on: TASK-catalog-6, TASK-catalog-7
  - Assigned to: unassigned
  - Done criteria: unit tests pass for filter change callbacks, search input, deactivation notice appears on `prototype.deactivated` SSE event, buy button hidden when deactivated

- [ ] TASK-catalog-test1: Integration tests for catalog endpoints and SSE
  - Context: end-to-end validation of GET endpoints with combined filters, pagination, cache behavior, and SSE event flow; uses Supertest + mocked Redis
  - Deliverable: `services/api-core/src/modules/catalog/**/*.integration-spec.ts`
  - Depends on: TASK-catalog-8
  - Assigned to: unassigned
  - Done criteria: integration.catalog.listPrototypes.withCategoryFilter, integration.catalog.listPrototypes.withPriceRange, integration.catalog.listPrototypes.withSearch, integration.catalog.listPrototypes.combinedFilters, integration.catalog.listPrototypes.pagination, integration.catalog.getPrototypeDetail.validId, integration.catalog.getPrototypeDetail.invalidId404, integration.catalog.cache.invalidationOnUpdate, integration.catalog.sse.emitsPrototypeUpdatedEvent, integration.catalog.sse.emitsPrototypeDeactivatedEvent. All pass.
