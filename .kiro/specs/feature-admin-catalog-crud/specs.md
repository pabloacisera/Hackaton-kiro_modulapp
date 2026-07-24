# Specs: Admin Catalog CRUD

## What it is

Full CRUD interface for the admin to create, edit, deactivate, and manage prototype products (modular furniture and arches) from the admin dashboard. This is the **source of truth** for all catalog data — prototypes only exist because an admin created them here.

## Business flow

1. Admin logs in to the dashboard.
2. Admin navigates to "Catalog" section.
3. Admin creates a prototype filling: name, description, category, price (USD), stock quantity, build-on-demand flag, estimated delivery days.
4. Admin uploads one or more images for the prototype.
5. On save, the prototype is persisted and an SSE event propagates to the landing in real-time (< 2 seconds).
6. Admin can later edit any field, upload/remove images, or deactivate a prototype.
7. All changes propagate via SSE to the landing immediately.

## Functional requirements

- FR1. Create a new prototype with all fields: name, description, category (modular_furniture | arches), price_usd, stock_qty, build_on_demand, estimated_delivery_days.
- FR2. Upload images during or after creation (reuses existing image upload endpoint).
- FR3. Edit any field of an existing prototype (partial update).
- FR4. Deactivate a prototype (soft delete — sets `active = false`). Deactivated prototypes disappear from the landing catalog instantly via SSE.
- FR5. List all prototypes (including inactive) with search and category filter. Admin sees both active and inactive prototypes (unlike the public catalog which only shows active).
- FR6. Every create/update/deactivate triggers: Redis cache invalidation + SSE event to landing.
- FR7. Reactivate a previously deactivated prototype.
- FR8. Delete images from a prototype (reuses existing image delete endpoint).

## Non-functional requirements

- Follows the same MVC pattern as other admin pages (SuppliesPage, OrdersPage).
- Mobile-first, responsive (Tailwind CSS).
- Form validation client-side (required fields, price > 0, stock >= 0).
- Backend validation with proper HTTP error codes (400 for invalid data, 404 for missing prototype).

## Edge cases

- Admin tries to set price to 0 or negative → rejected with validation error.
- Admin tries to set stock to negative → rejected with validation error.
- Admin deactivates a prototype that has pending orders → deactivation proceeds (orders are independent once created); the prototype just won't appear for new purchases.
- Admin creates a prototype without images → allowed (can add images later).

## Acceptance criteria

- Admin can create a prototype from the dashboard and it appears on the landing within 2 seconds.
- Admin can edit price/stock and the landing reflects the change via SSE within 2 seconds.
- Admin can deactivate a prototype and it disappears from the landing catalog immediately.
- Admin can see inactive prototypes in the admin listing (visually differentiated).
- All operations have proper error handling and user feedback.
