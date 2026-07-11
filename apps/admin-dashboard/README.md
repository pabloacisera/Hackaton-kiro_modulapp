# apps/admin-dashboard

Admin dashboard (React, MVC architecture — see
`.kiro/steerings/05-architecture-conventions.md`). Stock management, orders,
quotes, notifications (WebSocket).

Related features in `.kiro/specs/`:
`feature-admin-auth-core`, `feature-supply-stock-management`,
`feature-quote-management-admin`, `feature-order-delivery-schedule`,
`feature-realtime-notifications`.

```
src/
  models/         Data fetching, API calls
  views/          Presentation components
  controllers/    Orchestration hooks (Model ↔ View)
  hooks/          Custom React hooks
```

## Development

```bash
npm run dev
```

Runs on http://localhost:3001 (configured in Nginx for production).

## Testing

```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests with Playwright
```
