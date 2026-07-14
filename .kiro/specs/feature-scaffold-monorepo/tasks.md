# Tasks: Monorepo scaffolding and base infrastructure

- [ ] TASK-scaffold-1: Configure Turborepo at monorepo root
  - Context: foundation for the entire monorepo build system
  - Deliverable: `turbo.json` with pipeline (dev, build, lint, test), `pnpm-workspace.yaml`, root `package.json` scripts
  - Depends on: none
  - Assigned to: unassigned
  - Done criteria: `turbo run dev` from root starts the dev pipeline without errors

- [ ] TASK-scaffold-2: Scaffold `apps/landing` (React + Vite)
  - Context: public-facing catalog site, port 3000
  - Deliverable: React app with `npm run dev` showing placeholder page with "Landing — Port 3000"
  - Depends on: TASK-scaffold-1
  - Assigned to: unassigned
  - Done criteria: `pnpm dev` in apps/landing starts Vite on port 3000, browser shows placeholder

- [ ] TASK-scaffold-3: Scaffold `apps/admin-dashboard` (React + Vite)
  - Context: admin dashboard, port 3001
  - Deliverable: React app with `npm run dev` showing placeholder page with "Admin Dashboard — Port 3001"
  - Depends on: TASK-scaffold-1
  - Assigned to: unassigned
  - Done criteria: `pnpm dev` in apps/admin-dashboard starts Vite on port 3001, browser shows placeholder

- [ ] TASK-scaffold-4: Scaffold `services/api-core` (NestJS)
  - Context: backend domain service, port 8080
  - Deliverable: NestJS app with `/health` endpoint returning `{ status: "ok" }`
  - Depends on: TASK-scaffold-1
  - Assigned to: unassigned
  - Done criteria: `pnpm dev` in services/api-core starts NestJS on port 8080, `curl localhost:8080/health` returns 200

- [ ] TASK-scaffold-5: Scaffold `services/payment-service` (Spring Boot)
  - Context: financial microservice, port 8081
  - Deliverable: Spring Boot app with `/health` endpoint returning `{ "status": "ok" }`
  - Depends on: none (independent of Turborepo)
  - Assigned to: unassigned
  - Done criteria: `mvn spring-boot:run` starts on port 8081, `curl localhost:8081/health` returns 200

- [ ] TASK-scaffold-6: Create `packages/shared-types` with initial DTOs
  - Context: shared TypeScript types for cross-app type safety
  - Deliverable: `packages/shared-types/` with `LoginRequest`, `LoginResponse`, `RefreshResponse` types and proper `package.json`
  - Depends on: TASK-scaffold-1
  - Assigned to: unassigned
  - Done criteria: types compile, can be imported from apps and services

- [ ] TASK-scaffold-7: Create `infra/docker/docker-compose.yml`
  - Context: local development environment with all services
  - Deliverable: docker-compose.yml with api-core, payment-service, landing, admin-dashboard, redis, nginx
  - Depends on: TASK-scaffold-2, TASK-scaffold-3, TASK-scaffold-4, TASK-scaffold-5
  - Assigned to: unassigned
  - Done criteria: `docker compose up --build` starts all services, each responds on its port

- [ ] TASK-scaffold-8: Create `infra/nginx/nginx.conf`
  - Context: reverse proxy configuration for development
  - Deliverable: nginx.conf with proxy rules for /api/, /payments/, /, /admin/
  - Depends on: TASK-scaffold-7
  - Assigned to: unassigned
  - Done criteria: Nginx proxies /api/ to api-core, /payments/ to payment-service, / to landing

- [ ] TASK-scaffold-9: Verify and finalize `.env.example`
  - Context: developers need a complete reference for all required variables
  - Deliverable: `.env.example` with all variables from all services, properly commented
  - Depends on: TASK-scaffold-4, TASK-scaffold-5
  - Assigned to: unassigned
  - Done criteria: every variable referenced in any service code appears in .env.example, no unused variables

- [ ] TASK-scaffold-10: End-to-end verification — `bash scripts/dev-up.sh`
  - Context: the moment of truth — everything must work together
  - Deliverable: all services start via docker-compose, respond on expected ports, Nginx proxies correctly
  - Depends on: TASK-scaffold-7, TASK-scaffold-8, TASK-scaffold-9
  - Assigned to: unassigned
  - Done criteria: landing shows placeholder at localhost:3000, admin at localhost:3001, api-core health at localhost:8080/health, payment-service health at localhost:8081/health, Redis responds to PING
