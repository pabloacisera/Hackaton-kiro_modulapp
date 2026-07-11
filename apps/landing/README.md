# apps/landing

Public site (React, MVC architecture — see
`.kiro/steerings/05-architecture-conventions.md`). Catalog, direct purchase,
custom quote request, complaints/refunds.

Related features in `.kiro/specs/`:
`feature-catalog-landing`, `feature-direct-purchase`,
`feature-custom-quote`, `feature-complaints-refunds`,
`feature-i18n-localization`.

```
src/
  models/         Data fetching, API calls
  views/          Presentation components
  controllers/    Orchestration hooks (Model ↔ View)
  locales/        i18n translations
```

## Development

```bash
npm run dev
```

Runs on http://localhost:3000 (configured in Nginx for production).

## Testing

```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests with Playwright
```
