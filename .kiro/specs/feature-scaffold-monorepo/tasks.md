# Tasks: Monorepo scaffolding and base infrastructure

- [ ] TASK-scaffold-1: Configure Turborepo at monorepo root
  - Context: FR1 — foundation for the entire monorepo build system. Workspaces for `apps/*`, `services/api-core`, and `packages/*`.
  - Deliverable: `turbo.json` with pipeline (dev, build, lint, test), `pnpm-workspace.yaml`, root `package.json` with scripts
  - Depends on: none
  - Assigned to: unassigned
  - Done criteria: `turbo run dev` from root starts the dev pipeline without errors. `turbo run lint` completes without config errors. Workspace packages are resolved correctly (run `pnpm ls -r --depth 0` to verify).

- [ ] TASK-scaffold-2: Scaffold React apps (`apps/landing` + `apps/admin-dashboard`)
  - Context: FR2+FR3 — both apps are structurally identical React + Vite apps. Landing is public-facing (port 3000), admin dashboard is internal (port 3001). Each must show a placeholder with service name and port.
  - Deliverable: `apps/landing/` and `apps/admin-dashboard/`, each with `package.json` (dev/build/lint scripts), `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`
  - Depends on: TASK-scaffold-1
  - Assigned to: unassigned
  - Done criteria: `pnpm dev` in `apps/landing` starts Vite on port 3000 and renders a page containing "Landing" and "3000". `pnpm dev` in `apps/admin-dashboard` starts Vite on port 3001 and renders a page containing "Admin Dashboard" and "3001". `pnpm build` succeeds in both apps. `pnpm lint` completes without errors in both apps. Both apps are listed in the Turborepo workspace (verify via `pnpm ls -r` from root).

- [ ] TASK-scaffold-3: Scaffold `services/api-core` (NestJS)
  - Context: FR4 — backend domain service on port 8080 with a `/health` endpoint.
  - Deliverable: `services/api-core/` with `package.json`, `tsconfig.json`, `src/main.ts`, `src/app.module.ts`, `src/health/health.controller.ts` returning `{ status: "ok" }`
  - Depends on: TASK-scaffold-1
  - Assigned to: unassigned
  - Done criteria: `pnpm dev` in `services/api-core` starts NestJS on port 8080. `curl localhost:8080/health` returns HTTP 200 with body `{"status":"ok"}`. `pnpm build` compiles without errors. App is listed in the Turborepo workspace.

- [ ] TASK-scaffold-4: Scaffold `services/payment-service` (Spring Boot)
  - Context: FR5 — financial microservice on port 8081 with a `/health` endpoint. Does not participate in Turborepo; independent Maven build.
  - Deliverable: `services/payment-service/` with `pom.xml` (spring-boot-maven-plugin), `src/main/java/` application class, health endpoint returning `{"status":"ok"}`
  - Depends on: none (independent of Turborepo)
  - Assigned to: unassigned
  - Done criteria: `mvn spring-boot:run` starts on port 8081. `curl localhost:8081/health` returns HTTP 200 with body `{"status":"ok"}`. `mvn package -DskipTests` builds a runnable JAR. README documents that this service is outside Turborepo.

- [ ] TASK-scaffold-5: Create `packages/shared-types` with initial DTOs
  - Context: FR6 — shared TypeScript types for cross-app type safety. Defines `LoginRequest`, `LoginResponse`, `RefreshResponse`.
  - Deliverable: `packages/shared-types/` with `package.json` (name, main, types, build script), `tsconfig.json`, `src/index.ts` exporting all DTO types
  - Depends on: TASK-scaffold-1
  - Assigned to: unassigned
  - Done criteria: `pnpm build` in `packages/shared-types` compiles without errors. Types can be imported from both `apps/landing` and `apps/admin-dashboard` (add a test import in each app's `App.tsx`, verify `pnpm build` succeeds). Package is resolvable via workspace protocol (`@modula/shared-types`).

- [ ] TASK-scaffold-6: Create Docker Compose + Nginx infrastructure (`infra/`)
  - Context: FR7+FR8 — docker-compose.yml starts all services (api-core, payment-service, landing, admin-dashboard, Redis). Nginx reverse-proxies: `/api/` → api-core, `/payments/` → payment-service, `/` → landing, `/admin/` → admin-dashboard. Health checks ensure dependent services wait.
  - Deliverable: `infra/docker/docker-compose.yml`, `infra/nginx/nginx.conf`, `infra/nginx/Dockerfile` (if needed for config mount)
  - Depends on: TASK-scaffold-2, TASK-scaffold-3, TASK-scaffold-4
  - Assigned to: unassigned
  - Done criteria: `docker compose up --build` from `infra/docker/` starts all 5 services. Redis responds to `docker exec <redis-container> redis-cli PING` with `PONG`. Nginx proxies `/api/health` to api-core (returns `{"status":"ok"}`). Nginx proxies `/payments/health` to payment-service (returns `{"status":"ok"}`). Nginx proxies `/` to landing (returns HTML with "Landing"). Nginx proxies `/admin/` to admin-dashboard (returns HTML with "Admin Dashboard"). Each service container passes its health check (verify via `docker compose ps` — all show `healthy`).

- [ ] TASK-scaffold-7: Verify and finalize `.env.example`
  - Context: FR9 — every variable referenced in any service must appear in `.env.example`, no unused variables. Covers DATABASE_URL, Redis URL, and any service-specific vars.
  - Deliverable: `.env.example` at repo root with all variables properly commented and organized by service
  - Depends on: TASK-scaffold-3, TASK-scaffold-4
  - Assigned to: unassigned
  - Done criteria: Every environment variable referenced in `services/api-core/src/` and `services/payment-service/src/` exists in `.env.example`. No variable in `.env.example` is unreferenced. Each variable has a descriptive comment. Cross-check by grepping for `process.env.` and `@Value` / `application.properties` references against `.env.example` keys.

- [ ] TASK-scaffold-8: End-to-end verification — `bash scripts/dev-up.sh`
  - Context: FR10 — the full local stack must start and respond within 60 seconds via the dev script.
  - Deliverable: `scripts/dev-up.sh` that runs `docker compose up --build` (or equivalent) and blocks until all services are healthy
  - Depends on: TASK-scaffold-6, TASK-scaffold-7
  - Assigned to: unassigned
  - Done criteria: `bash scripts/dev-up.sh` starts all services within 60 seconds. Landing responds at http://localhost:3000 with visible "Landing" placeholder. Admin dashboard responds at http://localhost:3001 with visible "Admin Dashboard" placeholder. API core health at http://localhost:8080/health returns HTTP 200. Payment service health at http://localhost:8081/health returns HTTP 200. Nginx proxies `/api/*` to api-core and `/payments/*` to payment-service correctly. Redis PING returns PONG inside Docker network. Each service also starts independently without Docker (except payment-service which needs Java) — verify by running `pnpm dev` in `apps/landing`, `apps/admin-dashboard`, and `services/api-core` individually.
