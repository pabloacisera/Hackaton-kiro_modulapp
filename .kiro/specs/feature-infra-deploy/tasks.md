# Tasks: Infrastructure and deployment

> NOTE: Monorepo Turborepo setup is in `feature-scaffold-monorepo` (Phase 0).
> This feature starts after scaffold-monorepo is complete.

- [ ] TASK-infra-1: Multi-stage Dockerfiles for all services
  - Context: FR1 requires `api-core` (NestJS) and `payment-service` (Spring Boot) to run as containers. FR2 requires `landing` and `admin-dashboard` to produce `dist/` for Nginx. The edge case notes that `payment-service` (Java/Maven) is independent from Turborepo and needs its own build step.
  - Deliverable:
    - `services/api-core/Dockerfile` (Node multi-stage: build + runtime)
    - `services/payment-service/Dockerfile` (Maven multi-stage: build + JRE runtime)
    - `apps/landing/Dockerfile` (Node build stage producing `dist/`)
    - `apps/admin-dashboard/Dockerfile` (Node build stage producing `dist/`)
  - Depends on: feature-scaffold-monorepo (TASK-scaffold-1 through TASK-scaffold-6 must be complete)
  - Assigned to: unassigned
  - Done criteria: `docker build` succeeds for all four Dockerfiles without errors; `api-core` image starts and responds on its health endpoint; `payment-service` image starts and responds on its health endpoint; `landing` and `admin-dashboard` images produce valid `dist/` output containing `index.html`.

- [ ] TASK-infra-2: Nginx reverse proxy and statics configuration
  - Context: FR2 requires Nginx to serve React `dist/` statics in production and proxy `/api/*` to `api-core` and `/payments/*` to `payment-service` on the same domain (no CORS).
  - Deliverable: `infra/nginx/nginx.conf`
  - Depends on: TASK-infra-1
  - Assigned to: unassigned
  - Done criteria: Nginx config serves static files from `/usr/share/nginx/html`; `/api/*` routes proxied to `http://api-core:3000`; `/payments/*` routes proxied to `http://payment-service:8080`; config passes `nginx -t` validation; gzip enabled for text/html, text/css, application/javascript.

- [ ] TASK-infra-3: Docker Compose orchestration and environment template
  - Context: FR1 requires `docker-compose` starting `api-core`, `payment-service`, `landing`, `admin-dashboard`, and Redis. FR3 requires sensitive variables only via `.env` (never committed). The non-functional requirements call for clear environment separation with `.env.example` as the only committed env file.
  - Deliverable:
    - `infra/docker/docker-compose.yml` (dev profile)
    - `infra/docker/docker-compose.prod.yml` (production profile)
    - `.env.example` with all documented variables (Supabase, Upstash, PayPal, JWT, SMTP)
  - Depends on: TASK-infra-2
  - Assigned to: unassigned
  - Done criteria: `docker compose -f infra/docker/docker-compose.yml config` parses without error; all five services defined (api-core, payment-service, landing, admin-dashboard, redis); `.env.example` contains entries for every secret referenced in compose files (SUPABASE_URL, SUPABASE_KEY, UPSTASH_URL, UPSTASH_TOKEN, PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, JWT_SECRET, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS); `.env` and `.env.*` are in `.gitignore`; `docker compose up` starts all containers and Redis responds to `PING`.

- [ ] TASK-infra-4: Database seed script with fake data
  - Context: FR4 requires a seed script with fake data for development/testing covering prototypes, supplies, orders, quotes, and complaints in various states.
  - Deliverable: `scripts/seed-db.sh`, `services/api-core/src/seed/` (TypeScript seeder using `faker`)
  - Depends on: migrations from all domain features (feature-admin-auth-core, feature-catalog-landing, feature-direct-purchase, feature-custom-quote, feature-complaints-refunds, feature-supply-stock-management)
  - Assigned to: unassigned
  - Done criteria: `npm run seed` (or `scripts/seed-db.sh`) populates Supabase/Postgres with fake data; at least 10 prototypes, 20 supplies, 15 orders, 10 quotes, 10 complaints across multiple states; script is idempotent (running twice does not duplicate data); seed data is realistic (faker-based names, emails, amounts, dates).

- [ ] TASK-infra-5: Extend CI pipeline with Docker build and Maven job
  - Context: The CI pipeline (`ci.yml`) is initially created by TASK-auth-12. This task extends it with Docker image builds and a parallel Maven build for `payment-service`. The non-functional requirements state Turborepo cache must be leveraged in CI.
  - Deliverable: `.github/workflows/ci.yml` (extended)
  - Depends on: TASK-infra-1, TASK-auth-12 (feature-admin-auth-core)
  - Assigned to: unassigned
  - Done criteria: CI runs lint (zero errors), CI runs test suite (all green), CI runs build (all packages build via Turborepo), Turborepo cache works (second run is faster), Docker image build job produces images for `api-core`, `landing`, `admin-dashboard`, Maven build job compiles `payment-service` independently; all jobs pass green on a test PR.

- [ ] TASK-infra-6: Per-environment deployment documentation and production script
  - Context: FR3 requires environment separation (development, staging, production). The non-functional requirements expect `.env.development`, `.env.staging`, `.env.production` files (none committed except `.env.example`). `infra/README.md` references `scripts/prod-up.sh` which does not exist yet.
  - Deliverable:
    - `docs/deployment.md` (per-environment guide: dev, staging, production)
    - `scripts/prod-up.sh` (production deployment script)
  - Depends on: TASK-infra-3
  - Assigned to: unassigned
  - Done criteria: `docs/deployment.md` documents steps for all three environments (dev, staging, prod) including required `.env` files, build commands, and service startup; `scripts/prod-up.sh` runs `docker compose -f infra/docker/docker-compose.prod.yml` and all production services start cleanly; script exits non-zero on failure with descriptive error message; doc references `.env.example` as the starting template.

- [ ] TASK-infra-7: End-to-end integration test of docker-compose environment
  - Context: The acceptance criteria require `docker compose up` from scratch with a complete `.env` to leave the system functional end-to-end including test data via seed. This task validates the full stack as a single integration gate.
  - Deliverable: `infra/__tests__/docker-compose.integration-spec.ts` (or shell-based validation script)
  - Depends on: TASK-infra-1, TASK-infra-2, TASK-infra-3, TASK-infra-4
  - Assigned to: unassigned
  - Done criteria: all containers start (api-core, payment-service, landing, admin-dashboard, redis); `api-core` `/health` responds 200; `payment-service` `/health` responds 200; Nginx proxies `/api/*` to api-core and returns valid response; Nginx proxies `/payments/*` to payment-service and returns valid response; Redis responds to `PING` with `PONG`; seed data is present in database after `seed-db.sh` runs; test can be run via `npm run test:integration` or equivalent script.
