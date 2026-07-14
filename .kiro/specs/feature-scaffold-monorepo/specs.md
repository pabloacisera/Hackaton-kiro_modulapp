# Specs: Monorepo scaffolding and base infrastructure

## What it is

The foundation that makes every other feature possible. Sets up the Turborepo
monorepo structure, scaffolds all apps and services with working `dev` scripts,
and provides a Docker Compose environment that starts the full local stack.

## Functional requirements

- FR1. Turborepo configured at monorepo root with workspaces for `apps/*`,
  `services/api-core`, and `packages/*`.
- FR2. `apps/landing` scaffolded as a React + Vite app. `npm run dev` starts
  on port 3000 with a placeholder page.
- FR3. `apps/admin-dashboard` scaffolded as a React + Vite app. `npm run dev`
  starts on port 3001 with a placeholder page.
- FR4. `services/api-core` scaffolded as a NestJS app. `npm run dev` starts
  on port 8080 with a `/health` endpoint returning 200.
- FR5. `services/payment-service` scaffolded as a Spring Boot app.
  `mvn spring-boot:run` starts on port 8081 with a `/health` endpoint.
- FR6. `packages/shared-types` created with initial TypeScript types for auth
  DTOs (`LoginRequest`, `LoginResponse`, `RefreshResponse`).
- FR7. `infra/docker/docker-compose.yml` that starts: api-core, payment-service,
  landing (via Nginx), admin-dashboard (via Nginx), Redis, and connects to
  Supabase Postgres via `DATABASE_URL`.
- FR8. `infra/nginx/nginx.conf` with reverse proxy rules: `/api/` → api-core,
  `/payments/` → payment-service, `/` → landing statics, `/admin/` →
  admin-dashboard statics.
- FR9. `.env.example` complete and verified against all services (no missing
  keys, no extra unused keys).
- FR10. `scripts/dev-up.sh` works: `docker compose up` starts all services and
  they respond on their ports.

## Non-functional requirements

- Each app/service must have its own `package.json` with a `dev` script.
- React apps use Vite for fast HMR during development.
- NestJS app uses the built-in `nest start --dev` for development.
- Spring Boot app uses `spring-boot-maven-plugin` for development.
- All placeholder pages must show the service name and port for easy
  identification during development.
- The Docker Compose file must use health checks so dependent services wait
  for their dependencies.

## Edge cases

- `payment-service` (Java) does not participate in Turborepo — it is an
  independent Docker step with its own Maven build. This must be documented
  in the README.
- Supabase Postgres is always external (never starts in Docker Compose).
  The docker-compose only includes Redis as a local service.
- Developers without Docker must still be able to run each service individually
  via `npm run dev` (or `mvn spring-boot:run` for payment-service) against
  remote Supabase/Upstash.

## Acceptance criteria

- `bash scripts/dev-up.sh` starts all services within 60 seconds.
- Landing responds on http://localhost:3000 with a visible placeholder.
- Admin dashboard responds on http://localhost:3001 with a visible placeholder.
- API core responds on http://localhost:8080/health with HTTP 200.
- Payment service responds on http://localhost:8081/health with HTTP 200.
- Nginx proxies `/api/*` to api-core and `/payments/*` to payment-service.
- Redis responds to PING inside the Docker network.
- Each service can also start independently without Docker (except
  payment-service which needs Java).
