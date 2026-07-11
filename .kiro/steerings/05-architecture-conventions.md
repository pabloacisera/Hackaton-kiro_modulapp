# Architecture conventions

## Frontend (apps/landing, apps/admin-dashboard) — MVC

- **Model**: hooks/services that talk to the API (`src/models/`), typed with the
  shared DTOs from `packages/shared-types`. No JSX here.
- **View**: pure presentation components (`src/views/`), receive props, do not
  call the API directly.
- **Controller**: orchestration hooks (`src/controllers/useX.ts`) that connect
  Model ↔ View, manage local state and effects (SSE, WebSocket, submits).
- Mobile-first: every component is designed first for viewport ~360-390px and
  then expanded with breakpoints (Tailwind `sm/md/lg`).

## Backend domain (services/api-core) — Clean Architecture

```
src/
  domain/           entities, value objects, pure business rules (no framework)
  application/      use cases, orchestrate domain + ports
  infrastructure/   port implementations: DB (Prisma), Redis, SSE, email
  interface/        HTTP controllers (NestJS), input/output DTOs, guards
```

Rule: `domain/` imports nothing from `infrastructure/` or NestJS. Dependencies
always point inward (interface → application → domain).

## Financial microservice (services/payment-service) — Java/Spring Boot

Layered structure equivalent (`controller` → `service` → `domain` →
`repository`), isolated from NestJS. Communicates with `api-core` only via
HTTP/events, never shares a database directly — has its own schema for
transactions/receipts, with events/webhooks to `api-core` to reflect status
(paid, refunded, etc.).

## Inter-service communication

- `api-core` ↔ `payment-service`: synchronous HTTP for initiating payment/refund;
  webhook from `payment-service` to `api-core` to confirm result.
- `api-core` → `landing`: SSE (catalog broadcast).
- `api-core` → `admin-dashboard`: WebSockets (targeted notifications).
- Jobs: BullMQ lives inside `api-core` (same process or separate worker from
  the same Nest codebase).

## ORM: Prisma

**Prisma** is the ORM for `services/api-core`. All database operations go
through Prisma Client. TypeORM is not used.

- Schema files live in `services/api-core/prisma/schema.prisma`.
- Migrations are generated via `npx prisma migrate dev`.
- Never use raw SQL unless Prisma cannot express the query.

## Icon library: FontAwesome

**FontAwesome** (free tier) is the icon library for both landing and admin
dashboard. Use the `@fortawesome/react-fontawesome` package with the free
icon sets (solid, regular, brands).

## Testing

### Test types

| Type | Scope | Framework | Runs when |
|---|---|---|---|
| **Unit** | Individual functions, services, hooks | Jest (backend), Vitest (frontend) | Every commit (CI) |
| **Integration** | API endpoints, database operations, service communication | Jest + Supertest (backend), Testing Library (frontend) | Every commit (CI) |
| **E2E** | Full user flows (checkout, quote, payment) | Playwright or Cypress | Before merge to main |
| **Manual** | External services (PayPal sandbox, Mailjet), WebSocket behavior | curl, Postman, browser | As needed, documented in PR |

### Test generation rules

- **Every microtask** must include test criteria in its `tasks.md` entry.
- **Business logic** in `domain/` and `application/` layers MUST have unit tests.
- **API endpoints** in `interface/` MUST have integration tests.
- **Frontend controllers** SHOULD have unit tests for complex orchestration.
- **Infrastructure** (Prisma, Redis, email) is tested via integration tests
  with mocked external services.

### Manual testing

For changes that require external services (PayPal webhooks, email delivery,
WebSocket connections), document the manual test steps in the PR description:
- curl commands for API endpoints
- Postman collections if applicable
- Browser steps for WebSocket/UI testing

### Test naming convention

```
<type>.<module>.<function/scenario>.<expected-result>
```

Examples:
- `unit.quote.service.calculateExpiration.correctDate`
- `integration.order.accept.deductsStock`
- `e2e.customer.acceptsQuoteAndPays.successfulCheckout`

## Environment variables

All environment variables are documented in `.kiro/steerings/09-environment-variables.md`.
Once `.env` is populated with real keys, it is **immutable** — cannot be
modified, edited, or deleted without following the documentation process.

## Directory structure — English only

All directory names must be in English:
- `.kiro/steerings/09-environment-variables.md` (not `variables-de-entorno.md`)
- `docs/feature-status.md` (not `estado-features.md`)
- `docs/collaboration-log.md` (not `registro-colaboracion.md`)
- `docs/templates/` (not `plantillas/`)
