# Tasks: Public catalog on landing

- [ ] TASK-catalog-1: Migration for `prototypes` + `proto_images` tables
  - Context: database for catalog domain
  - Deliverable: SQL/Prisma migration
  - Depends on: none
  - Done criterion: migration runs cleanly on dev DB

- [ ] TASK-catalog-2: `Prototype` domain entity + rules (`active` implies visible, `stock_qty` cannot be negative)
  - Deliverable: `domain/prototype.entity.ts`
  - Depends on: TASK-catalog-1
  - Done criterion: unit tests for invariants

- [ ] TASK-catalog-3: `GET /catalog/prototypes` endpoint with filters + pagination
  - Deliverable: controller + use case `ListPrototypes`
  - Depends on: TASK-catalog-2
  - Done criterion: integration test with combined filters

- [ ] TASK-catalog-4: `GET /catalog/prototypes/:id` endpoint
  - Depends on: TASK-catalog-2

- [ ] TASK-catalog-5: Redis cache for listings with invalidation on update
  - Depends on: TASK-catalog-3

- [ ] TASK-catalog-6: SSE endpoint `/catalog/stream` + event publisher from admin catalog module
  - Depends on: TASK-catalog-2

- [ ] TASK-catalog-7: `models/catalogApi.ts` (fetch + EventSource) in apps/landing
  - Depends on: TASK-catalog-3, TASK-catalog-6

- [ ] TASK-catalog-8: `controllers/useCatalog.ts` with SSE event merge and backoff reconnection
  - Depends on: TASK-catalog-7

- [ ] TASK-catalog-9: `views/CatalogGrid` + `PrototypeCard` (mobile-first)
  - Depends on: TASK-catalog-8

- [ ] TASK-catalog-10: `views/PrototypeDetail` + image gallery
  - Depends on: TASK-catalog-4

- [ ] TASK-catalog-11: `views/CatalogFilters` (category, price, search)
  - Depends on: TASK-catalog-9

- [ ] TASK-catalog-12: "No longer available" notice on detail via `prototype.deactivated` event
  - Depends on: TASK-catalog-10, TASK-catalog-6
