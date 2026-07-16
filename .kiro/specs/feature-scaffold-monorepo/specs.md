# Specs: Monorepo scaffolding and base infrastructure

## What it is

The foundation that makes every other feature possible. Sets up the Turborepo
monorepo structure, scaffolds all apps and services with working `dev` scripts,
and provides a Docker Compose environment that starts the full local stack.

## Functional requirements

- FR1. Turborepo configured at monorepo root with workspaces for `apps/*`,
  `apps/api-core`, and `packages/*`.
- FR2. `apps/landing` scaffolded as a React + Vite app. `npm run dev` starts
  on port 3000 with a placeholder page.
- FR3. `apps/admin-dashboard` scaffolded as a React + Vite app. `npm run dev`
  starts on port 3001 with a placeholder page.
- FR4. `apps/api-core` scaffolded as a NestJS app. `npm run dev` starts
  on port 8080 with a `/health` endpoint returning 200.
- FR5. `apps/payment-service` scaffolded as a Spring Boot app.
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
- FR11. ESLint + Prettier configured at monorepo root with shared configs that
  all workspaces inherit. `pnpm lint` passes in every workspace. `pnpm format`
  formats consistently.
- FR12. Testing frameworks configured: Vitest for React apps (landing,
  admin-dashboard), Jest for NestJS (api-core). `pnpm test` runs in every
  JS/TS workspace (even with zero tests). Test scripts in each `package.json`.
- FR13. Minimum CI pipeline via GitHub Actions (`.github/workflows/ci.yml`):
  lint + test + build for all JS/TS workspaces. Runs on every PR and push to
  `main`. Turborepo cache leveraged. No deploy stage yet (added later by
  `feature-infra-deploy`).
- FR14. Git hooks via husky + lint-staged: pre-commit hook runs ESLint + Prettier
  on staged files. Prevents commits with lint errors.
- FR15. Root `README.md` with: prerequisites (Node, pnpm, Java, Docker),
  quick-start setup (clone, .env, dev-up.sh), architecture overview, links to
  `docs/` and `.kiro/steerings/00-project-context.md`.

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
- ESLint config is shared from root — individual workspaces can extend but
  not override the base rules.
- CI must complete in under 5 minutes using Turborepo cache.
- Git hooks must not block commits for non-JS files (e.g., .md, .yml).
- README must be in English (per working language convention).

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
- `pnpm lint` passes in all workspaces with zero errors.
- `pnpm test` runs in all JS/TS workspaces (even with zero tests).
- `git commit` with a linted file succeeds; commit with unlinted file is
  blocked by pre-commit hook.
- CI pipeline runs on a test PR: lint passes, tests run, build succeeds.
- Root README exists and documents setup steps.
