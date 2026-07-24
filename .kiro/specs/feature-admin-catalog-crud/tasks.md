# Tasks: Admin Catalog CRUD

- [ ] TASK-admincatalog-1: Backend CRUD endpoints (create, list, get, update, deactivate, reactivate)
  - Context: FR1, FR3, FR4, FR5, FR6, FR7 — admin needs full CRUD to manage prototypes. The repository `save()` already supports upsert; SSE publisher and cache invalidation already exist. Need to add `findAllAdmin` to repository (includes inactive), create/update DTOs with validation, and wire the endpoints into the existing `AdminCatalogController`.
  - Deliverable: Extended `AdminCatalogController` with 6 new endpoints, `CreatePrototypeDto` and `UpdatePrototypeDto` classes with class-validator decorators, `findAllAdmin` method in `IPrototypeRepository` + `PrismaPrototypeRepository`.
  - Depends on: none (infrastructure already exists)
  - Assigned to: unassigned
  - Done criteria: Unit tests pass for: create with valid data returns 201, create with invalid data (negative price, missing name) returns 400, list returns active+inactive prototypes, update partial fields works, deactivate sets active=false and publishes SSE event, reactivate sets active=true and publishes SSE event, get by invalid ID returns 404.

- [ ] TASK-admincatalog-2: Admin dashboard — catalogApi model + useCatalog controller + CatalogPage view
  - Context: FR1–FR8 — the admin dashboard needs a Catalog page with table listing (active + inactive prototypes), create/edit modal form, deactivate/reactivate buttons, and image management. Follows SuppliesPage pattern (MVC: model → controller hook → view).
  - Deliverable: `apps/admin-dashboard/src/models/catalogApi.ts`, `apps/admin-dashboard/src/controllers/useCatalog.ts`, `apps/admin-dashboard/src/views/CatalogPage.tsx`, route registered in `App.tsx`.
  - Depends on: TASK-admincatalog-1
  - Assigned to: unassigned
  - Done criteria: Unit tests pass for: useCatalog fetches and returns prototypes, create calls API and reloads, update calls API and reloads, deactivate/reactivate toggle works. CatalogPage renders table with all fields, inactive prototypes show visual indicator (gray/badge), Add Prototype button opens form, form validates required fields client-side, Edit/Deactivate/Reactivate buttons trigger correct actions.

- [ ] TASK-admincatalog-3: Integration test — full admin catalog lifecycle
  - Context: End-to-end validation: admin creates prototype → appears in public catalog → admin updates price → SSE event emitted → admin deactivates → SSE deactivated event emitted → admin reactivates → appears again. Uses Supertest + in-memory or test DB.
  - Deliverable: `apps/api-core/src/modules/catalog/admin-catalog.integration-spec.ts`
  - Depends on: TASK-admincatalog-1
  - Assigned to: unassigned
  - Done criteria: integration.adminCatalog.createPrototype.success, integration.adminCatalog.createPrototype.validation400, integration.adminCatalog.listAll.includesInactive, integration.adminCatalog.update.partialFields, integration.adminCatalog.deactivate.setsInactiveAndPublishesEvent, integration.adminCatalog.reactivate.setsActiveAndPublishesEvent, integration.adminCatalog.getById.notFound404. All pass.
