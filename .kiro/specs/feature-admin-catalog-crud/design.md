# Design: Admin Catalog CRUD

## Existing infrastructure (reused)

- **Domain entity**: `Prototype` (`apps/api-core/src/modules/catalog/domain/prototype.entity.ts`) — already has all fields, invariants, and `deactivate()`/`updatePrice()` methods.
- **Repository**: `IPrototypeRepository.save()` uses **upsert** — supports both create and update.
- **Image upload/delete**: `AdminCatalogController` already handles `POST prototypes/:id/images` and `DELETE prototypes/:prototypeId/images/:imageId`.
- **SSE events**: `CatalogEventPublisher` already publishes `prototype.updated` and `prototype.deactivated`.
- **Cache invalidation**: `CatalogCacheService.invalidateListings()` already exists.

## New endpoints (api-core, admin-catalog controller)

All under `/api/admin/catalog/` prefix (JWT-protected):

```
POST   /prototypes              → Create prototype (returns full DTO)
GET    /prototypes              → List all (active + inactive), with ?q=&category=&page=&pageSize=
GET    /prototypes/:id          → Get single prototype detail
PATCH  /prototypes/:id          → Update prototype fields (partial)
PATCH  /prototypes/:id/deactivate  → Set active=false, publish SSE deactivated event
PATCH  /prototypes/:id/reactivate  → Set active=true, publish SSE updated event
```

## DTOs

```typescript
// CreatePrototypeDto
{
  name: string;           // required, min 2 chars
  description: string;    // required, min 10 chars
  category: 'modular_furniture' | 'arches';  // required
  priceUsd: number;       // required, > 0
  stockQty: number;       // required, >= 0
  buildOnDemand: boolean; // required
  estimatedDeliveryDays?: number | null;  // optional
}

// UpdatePrototypeDto (all optional)
{
  name?: string;
  description?: string;
  category?: 'modular_furniture' | 'arches';
  priceUsd?: number;      // > 0
  stockQty?: number;      // >= 0
  buildOnDemand?: boolean;
  estimatedDeliveryDays?: number | null;
}

// AdminPrototypeDto (response — includes inactive ones)
{
  id: string;
  name: string;
  description: string;
  category: string;
  priceUsd: number;
  active: boolean;
  stockQty: number;
  buildOnDemand: boolean;
  estimatedDeliveryDays: number | null;
  images: { id: string; url: string; order: number }[];
  createdAt: string;
  updatedAt: string;
}
```

## Repository change

`IPrototypeRepository` needs a new method:

```typescript
findAllAdmin(filter: AdminListFilter): Promise<PaginatedPrototypes>;
```

This is different from `findAll` because it includes **inactive** prototypes (no `active: true` filter).

## Frontend (admin-dashboard, MVC)

- `models/catalogApi.ts`: HTTP calls to admin catalog endpoints.
- `controllers/useCatalog.ts`: state management for list, create, update, deactivate, reactivate.
- `views/CatalogPage.tsx`: table listing + "Add Prototype" button, modal form for create/edit, deactivate/reactivate actions.

Follows the exact same pattern as `SuppliesPage` + `useSupplies` + `suppliesApi`.

## SSE event flow (already implemented)

```
Admin action → save to DB → invalidate Redis cache → publish SSE event → landing updates
```

The SSE publisher (`CatalogEventPublisher`) and cache service (`CatalogCacheService`) are already wired. New endpoints just need to call them after persistence (same pattern as the image upload endpoint already does).

## Cross-feature dependencies

- Depends on: `feature-catalog-landing` (status: in-progress, 8/9 tasks done)
- If not merged: all infrastructure this feature needs (entity, repository, SSE, cache) is already on `main`. Only the integration test (TASK-catalog-test1) is pending.
- Depends on: `feature-admin-auth-core` (status: merged) — JWT auth guard for admin endpoints.
