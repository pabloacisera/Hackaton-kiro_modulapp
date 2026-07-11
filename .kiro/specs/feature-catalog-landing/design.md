# Design: Public catalog on landing

## Data model (api-core, `catalog` domain)

```
Prototype {
  id: uuid
  name: string
  description: text
  category: enum('mobiliario_modular', 'arcos')
  price_usd: decimal(10,2)
  active: boolean
  stock_qty: int            // finished product stock
  build_on_demand: boolean  // true = can be manufactured even if stock_qty is 0
  estimated_delivery_days: int | null
  images: ProtoImage[]
}
ProtoImage { id, prototype_id, url, order }
```

## Endpoints (interface/http, NestJS)

- `GET /api/catalog/prototypes?category=&q=&minPrice=&maxPrice=&page=&pageSize=`
  → paginated, cached in Redis (short TTL, invalidated on each admin update).
- `GET /api/catalog/prototypes/:id` → detail.
- `GET /api/catalog/stream` (SSE) → emits events:
  - `prototype.updated` `{ id, price_usd, stock_qty, active }`
  - `prototype.deactivated` `{ id }`

## Frontend (apps/landing, MVC)

- `models/catalogApi.ts`: fetch + SSE subscription (`EventSource`).
- `controllers/useCatalog.ts`: maintains list/filter state, merges SSE events onto local state (by `id`), handles reconnection with exponential backoff.
- `views/CatalogGrid`, `views/PrototypeCard`, `views/PrototypeDetail`, `views/CatalogFilters`.

## Cache invalidation

Each `PUT/PATCH` by the admin on a prototype:
1. Updates Postgres.
2. Invalidates the Redis key for the affected page/query (or short TTL + SSE as source of truth for UI, cache only to reduce listing load).
3. Publishes the SSE event.

## Security

The final purchase price is **always** re-read server-side in `feature-direct-purchase` when creating the order — SSE is only UX, never the source of truth for charging.
