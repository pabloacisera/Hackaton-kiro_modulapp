# Tasks: Public catalog on landing

- [ ] TASK-catalog-1: Migration for `prototypes` + `proto_images` tables
  - Context: database for catalog domain
  - Deliverable: SQL/Prisma migration
  - Depends on: none
  - Assigned to: unassigned
  - Done criterion: migration runs cleanly on dev DB

- [ ] TASK-catalog-2: `Prototype` domain entity + rules (`active` implies visible, `stock_qty` cannot be negative)
  - Deliverable: `domain/prototype.entity.ts`
  - Depends on: TASK-catalog-1
  - Assigned to: unassigned
  - Done criterion: unit tests for invariants

- [ ] TASK-catalog-3: `GET /catalog/prototypes` endpoint with filters + pagination
  - Deliverable: controller + use case `ListPrototypes`
  - Depends on: TASK-catalog-2
  - Assigned to: unassigned
  - Done criterion: integration test with combined filters

- [ ] TASK-catalog-4: `GET /catalog/prototypes/:id` endpoint
  - Depends on: TASK-catalog-2
  - Assigned to: unassigned

- [ ] TASK-catalog-5: Redis cache for listings with invalidation on update
  - Depends on: TASK-catalog-3
  - Assigned to: unassigned

- [ ] TASK-catalog-6: SSE endpoint `/catalog/stream` + event publisher from admin catalog module
  - Depends on: TASK-catalog-2
  - Assigned to: unassigned

- [ ] TASK-catalog-7: `models/catalogApi.ts` (fetch + EventSource) in apps/landing
  - Depends on: TASK-catalog-3, TASK-catalog-6
  - Assigned to: unassigned

- [ ] TASK-catalog-8: `controllers/useCatalog.ts` with SSE event merge and backoff reconnection
  - Depends on: TASK-catalog-7
  - Assigned to: unassigned

- [ ] TASK-catalog-9: `views/CatalogGrid` + `PrototypeCard` (mobile-first)
  - Depends on: TASK-catalog-8
  - Assigned to: unassigned

- [ ] TASK-catalog-10: `views/PrototypeDetail` + image gallery
  - Depends on: TASK-catalog-4
  - Assigned to: unassigned

- [ ] TASK-catalog-11: `views/CatalogFilters` (category, price, search)
  - Depends on: TASK-catalog-9
  - Assigned to: unassigned

- [ ] TASK-catalog-12: "No longer available" notice on detail via `prototype.deactivated` event
  - Depends on: TASK-catalog-10, TASK-catalog-6
  - Assigned to: unassigned

- [ ] TASK-catalog-test1: Unit tests for catalog domain rules
  - Context: Prototype entity invariants must be tested: active implies visible, stock_qty non-negative, build_on_demand allows stock=0 purchase.
  - Deliverable: `services/api-core/src/modules/catalog/**/*.spec.ts`
  - Depends on: TASK-catalog-6
  - Assigned to: unassigned
  - Done criteria: unit.prototype.activeImpliesVisible, unit.prototype.stockQtyCannotBeNegative, unit.prototype.buildOnDemandAllowsZeroStock, unit.cache.invalidationOnUpdate. All pass.

- [ ] TASK-catalog-test2: Integration tests for catalog endpoints and SSE
  - Context: validates GET endpoints with combined filters, pagination, and SSE event flow. Uses Supertest + mocked Redis.
  - Deliverable: `services/api-core/src/modules/catalog/**/*.integration-spec.ts`
  - Depends on: TASK-catalog-12
  - Assigned to: unassigned
  - Done criteria: integration.catalog.listPrototypes.withCategoryFilter, integration.catalog.listPrototypes.withPriceRange, integration.catalog.listPrototypes.withSearch, integration.catalog.listPrototypes.combinedFilters, integration.catalog.getPrototypeDetail.validId, integration.catalog.getPrototypeDetail.invalidId404, integration.catalog.sse.emitsPrototypeUpdatedEvent, integration.catalog.sse.emitsPrototypeDeactivatedEvent. All pass.
