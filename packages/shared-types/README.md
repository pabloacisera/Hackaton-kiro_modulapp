# packages/shared-types

Shared types/DTOs between `apps/landing`, `apps/admin-dashboard`, and
`apps/api-core` (via Turborepo). Examples: `Prototype`, `Order`, `Quote`,
`Complaint`, `Supply` and their respective request/response DTOs.

Does not include types from the Java microservice — that contract is
documented separately in `docs/` (or can be generated from an OpenAPI spec
if the project adopts it later).

## Usage

```typescript
import { Prototype, Order } from '@modula/shared-types';
```

## Adding new types

1. Create or update the type file in `src/`.
2. Export from `src/index.ts`.
3. Run `npm run build` to compile.
4. Import in consuming packages.

## Testing

```bash
npm run test
```
