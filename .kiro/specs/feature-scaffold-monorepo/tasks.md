# Tasks: Monorepo scaffolding and base infrastructure

## Dependency graph

```
TASK-scaffold-1  (Turborepo root)
├── TASK-scaffold-9  (ESLint + Prettier) ─────────┐
│   ├── TASK-scaffold-2  (React apps)             │
│   │   └── TASK-scaffold-10 (Testing setup) ────┤
│   ├── TASK-scaffold-3  (NestJS api-core)        │
│   │   └── TASK-scaffold-10 (Testing setup) ────┤
│   ├── TASK-scaffold-12 (Git hooks)              │
│   └── TASK-scaffold-11 (CI pipeline) ◄──────────┘
├── TASK-scaffold-4  (Spring Boot, independent)
├── TASK-scaffold-5  (shared-types)
├── TASK-scaffold-6  (Docker + Nginx)
├── TASK-scaffold-7  (.env.example)
└── TASK-scaffold-8  (dev-up.sh verification)
    └── TASK-scaffold-13 (Root README)
```

**Collaborative note:** 
- **Phase A (parallel from start):** TASK-scaffold-1 + TASK-scaffold-4 (no inter-dependencies, different devs can claim both).
- **Phase B (after TASK-scaffold-1):** TASK-scaffold-9, TASK-scaffold-5 can start in parallel.
- **Phase C (after TASK-scaffold-9):** TASK-scaffold-2, TASK-scaffold-3, TASK-scaffold-12 can start in parallel.
- **Phase D (after TASK-scaffold-2+3):** TASK-scaffold-10, TASK-scaffold-6 can start.
- **Phase E (after TASK-scaffold-9+10):** TASK-scaffold-11 (CI pipeline).
- **Phase F (after TASK-scaffold-3+4):** TASK-scaffold-7 (.env.example).
- **Phase G (after TASK-scaffold-6+7):** TASK-scaffold-8 (dev-up.sh).
- **Phase H (after TASK-scaffold-8):** TASK-scaffold-13 (README) — last task.

---

- [x] TASK-scaffold-1: Configure Turborepo at monorepo root
  - Context: FR1 — foundation for the entire monorepo build system. Workspaces for `apps/*`, `services/api-core`, and `packages/*`.
  - Deliverable: `turbo.json` with pipeline (dev, build, lint, test), `pnpm-workspace.yaml`, root `package.json` with scripts
  - Depends on: none
  - Assigned to: Pablo
  - Done criteria: `turbo run dev` from root starts the dev pipeline without errors. `turbo run lint` completes without config errors. Workspace packages are resolved correctly (run `pnpm ls -r --depth 0` to verify).

- [x] TASK-scaffold-9: ESLint + Prettier configuration (root + all workspaces)
  - Context: FR11 — shared lint and format config. Every workspace must pass `pnpm lint` and `pnpm format:check`. This task must complete before React apps (TASK-scaffold-2) and NestJS (TASK-scaffold-3) claim lint passes in their Done criteria.
  - Deliverable: `.eslintrc.js` (root), `.prettierrc` (root), ESLint configs per workspace (React extends `plugin:react/recommended`), dev dependencies at root (`eslint`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`, `prettier`, `eslint-config-prettier`), lint/format scripts in each workspace `package.json`
  - Depends on: TASK-scaffold-1
  - Assigned to: unassigned
  - Done criteria: `pnpm lint` passes in all JS/TS workspaces with zero errors. `pnpm format:check` passes. `pnpm lint:fix` auto-fixes simple issues. Root `.eslintrc.js` and `.prettierrc` exist and are valid. Each workspace extends root config correctly. Unit test: introduce a deliberate lint error (unused variable), verify `pnpm lint` catches it, verify `pnpm lint:fix` resolves it. All pass.

- [x] TASK-scaffold-2: Scaffold React apps (`apps/landing` + `apps/admin-dashboard`)
  - Context: FR2+FR3 — both apps are structurally identical React + Vite apps. Landing is public-facing (port 3000), admin dashboard is internal (port 3001). Each must show a placeholder with service name and port.
  - Deliverable: `apps/landing/` and `apps/admin-dashboard/`, each with `package.json` (dev/build/lint/test scripts), `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`
  - Depends on: TASK-scaffold-1, TASK-scaffold-9
  - Assigned to: unassigned
  - Done criteria: `pnpm dev` in `apps/landing` starts Vite on port 3000 and renders a page containing "Landing" and "3000". `pnpm dev` in `apps/admin-dashboard` starts Vite on port 3001 and renders a page containing "Admin Dashboard" and "3001". `pnpm build` succeeds in both apps. `pnpm lint` completes without errors in both apps (inherits from TASK-scaffold-9 config). Both apps are listed in the Turborepo workspace (verify via `pnpm ls -r` from root).

- [x] TASK-scaffold-3: Scaffold `services/api-core` (NestJS)
  - Context: FR4 — backend domain service on port 8080 with a `/health` endpoint.
  - Deliverable: `services/api-core/` with `package.json`, `tsconfig.json`, `src/main.ts`, `src/app.module.ts`, `src/health/health.controller.ts` returning `{ status: "ok" }`
  - Depends on: TASK-scaffold-1, TASK-scaffold-9
  - Assigned to: unassigned
  - Done criteria: `pnpm dev` in `services/api-core` starts NestJS on port 8080. `curl localhost:8080/health` returns HTTP 200 with body `{"status":"ok"}`. `pnpm build` compiles without errors. `pnpm lint` completes without errors (inherits from TASK-scaffold-9 config). App is listed in the Turborepo workspace.

- [x] TASK-scaffold-4: Scaffold `services/payment-service` (Spring Boot)
  - Context: FR5 — financial microservice on port 8081 with a `/health` endpoint. Does not participate in Turborepo; independent Maven build.
  - Deliverable: `services/payment-service/` with `pom.xml` (spring-boot-maven-plugin), `src/main/java/` application class, health endpoint returning `{"status":"ok"}`
  - Depends on: none (independent of Turborepo)
  - Assigned to: unassigned
  - Done criteria: `mvn spring-boot:run` starts on port 8081. `curl localhost:8081/health` returns HTTP 200 with body `{"status":"ok"}`. `mvn package -DskipTests` builds a runnable JAR. README documents that this service is outside Turborepo.

- [x] TASK-scaffold-5: Create `packages/shared-types` with initial DTOs
  - Context: FR6 — shared TypeScript types for cross-app type safety. Defines `LoginRequest`, `LoginResponse`, `RefreshResponse`.
  - Deliverable: `packages/shared-types/` with `package.json` (name, main, types, build script), `tsconfig.json`, `src/index.ts` exporting all DTO types
  - Depends on: TASK-scaffold-1
  - Assigned to: unassigned
  - Done criteria: `pnpm build` in `packages/shared-types` compiles without errors. Types can be imported from both `apps/landing` and `apps/admin-dashboard` (add a test import in each app's `App.tsx`, verify `pnpm build` succeeds). Package is resolvable via workspace protocol (`@modula/shared-types`).

- [x] TASK-scaffold-10: Testing framework setup (Vitest for React, Jest for NestJS)
  - Context: FR12 — every JS/TS workspace must have a working test runner. The first business feature (admin-auth-core) requires unit tests from TASK-auth-1. Without test config, tests cannot run.
  - Deliverable: `vitest.config.ts` in `apps/landing` and `apps/admin-dashboard`, `jest.config.ts` in `services/api-core`, `src/test-setup.ts` in React apps (jsdom environment), test scripts in each workspace `package.json`
  - Depends on: TASK-scaffold-2, TASK-scaffold-3
  - Assigned to: unassigned
  - Done criteria: `pnpm test` runs in `apps/landing`, `apps/admin-dashboard`, and `services/api-core` (even with zero tests, runner exits cleanly). Vitest uses jsdom environment for React components. Jest uses node environment for NestJS. Test scripts in `package.json` are correct (`vitest run` for React, `jest --config jest.config.ts` for NestJS). Unit test: create a trivial test file in each workspace (e.g., `describe('sanity', () => it('works', () => expect(true).toBe(true)))`), verify `pnpm test` passes. All pass.

- [x] TASK-scaffold-6: Create Docker Compose + Nginx infrastructure (`infra/`)
  - Context: FR7+FR8 — docker-compose.yml starts all services (api-core, payment-service, landing, admin-dashboard, Redis). Nginx reverse-proxies: `/api/` → api-core, `/payments/` → payment-service, `/` → landing, `/admin/` → admin-dashboard. Health checks ensure dependent services wait.
  - Deliverable: `infra/docker/docker-compose.yml`, `infra/nginx/nginx.conf`, `infra/nginx/Dockerfile` (if needed for config mount)
  - Depends on: TASK-scaffold-2, TASK-scaffold-3, TASK-scaffold-4
  - Assigned to: unassigned
  - Done criteria: `docker compose up --build` from `infra/docker/` starts all 5 services. Redis responds to `docker exec <redis-container> redis-cli PING` with `PONG`. Nginx proxies `/api/health` to api-core (returns `{"status":"ok"}`). Nginx proxies `/payments/health` to payment-service (returns `{"status":"ok"}`). Nginx proxies `/` to landing (returns HTML with "Landing"). Nginx proxies `/admin/` to admin-dashboard (returns HTML with "Admin Dashboard"). Each service container passes its health check (verify via `docker compose ps` — all show `healthy`).

- [x] TASK-scaffold-7: Verify and finalize `.env.example`
  - Context: FR9 — every variable referenced in any service must appear in `.env.example`, no unused variables. Covers DATABASE_URL, Redis URL, and any service-specific vars.
  - Deliverable: `.env.example` at repo root with all variables properly commented and organized by service
  - Depends on: TASK-scaffold-3, TASK-scaffold-4
  - Assigned to: unassigned
  - Done criteria: Every environment variable referenced in `services/api-core/src/` and `services/payment-service/src/` exists in `.env.example`. No variable in `.env.example` is unreferenced. Each variable has a descriptive comment. Cross-check by grepping for `process.env.` and `@Value` / `application.properties` references against `.env.example` keys. Also verify that `docker-compose.yml` `env_file: .env` references match `.env.example` keys.

- [x] TASK-scaffold-8: End-to-end verification — `bash scripts/dev-up.sh`
  - Context: FR10 — the full local stack must start and respond within 60 seconds via the dev script.
  - Deliverable: `scripts/dev-up.sh` that runs `docker compose up --build` (or equivalent) and blocks until all services are healthy
  - Depends on: TASK-scaffold-6, TASK-scaffold-7
  - Assigned to: unassigned
  - Done criteria: `bash scripts/dev-up.sh` starts all services within 60 seconds. Landing responds at http://localhost:3000 with visible "Landing" placeholder. Admin dashboard responds at http://localhost:3001 with visible "Admin Dashboard" placeholder. API core health at http://localhost:8080/health returns HTTP 200. Payment service health at http://localhost:8081/health returns HTTP 200. Nginx proxies `/api/*` to api-core and `/payments/*` to payment-service correctly. Redis PING returns PONG inside Docker network. Each service also starts independently without Docker (except payment-service which needs Java) — verify by running `pnpm dev` in `apps/landing`, `apps/admin-dashboard`, and `services/api-core` individually.

- [x] TASK-scaffold-11: CI pipeline (minimum viable — lint + test + build)
  - Context: FR13 — 3 developers will submit PRs from day 1. Layer 2 of the protection model (CI) must exist before any business feature PRs are created. Basic lint+test+build should be in scaffold-monorepo so the very first PR has CI checks. The Java payment-service is NOT in this pipeline yet — added later by feature-infra-deploy.
  - Deliverable: `.github/workflows/ci.yml` — runs on PR and push to `main`, steps: checkout → pnpm setup → Node 20 → install → turbo lint → turbo test → turbo build (with Turborepo cache)
  - Depends on: TASK-scaffold-9, TASK-scaffold-10
  - Assigned to: unassigned
  - Done criteria: Push to a branch triggers CI. Lint passes (all workspaces). Test suite runs (all JS/TS workspaces). Build succeeds (all workspaces). Second push to same branch uses Turborepo cache and completes faster. CI status badge is visible in PR checks. `payment-service` (Java) is NOT in this pipeline yet — added later by `feature-infra-deploy`. Unit test: create a test PR with a deliberate lint error, verify CI fails. Fix the error, push again, verify CI passes. All pass.

- [x] TASK-scaffold-12: Git hooks (husky + lint-staged)
  - Context: FR14 — pre-commit hooks enforce lint+format on every commit. Without this, developers can commit unlinted code and only discover it at PR time (Layer 2). Hooks catch it at Layer 1 (local).
  - Deliverable: `.husky/pre-commit` (shell script running `npx lint-staged`), `lint-staged` config in root `package.json` (TS/TSX → eslint --fix + prettier --write; JSON/MD/YML → prettier --write), dev dependencies (`husky`, `lint-staged`), `"prepare": "husky install"` script in root `package.json`
  - Depends on: TASK-scaffold-9
  - Assigned to: unassigned
  - Done criteria: `git commit` with a linted TypeScript file succeeds. `git commit` with a file containing a lint error (e.g., unused variable) is blocked by pre-commit hook. `git commit` with a markdown file runs Prettier formatting. `npx husky` shows hooks directory exists. `.husky/pre-commit` is executable. Unit test: stage a file with `console.log('debug')` (eslint no-console rule), attempt commit, verify hook blocks it. Remove the line, commit succeeds. All pass.

- [x] TASK-scaffold-13: Root README.md with setup instructions
  - Context: FR15 — every developer needs a README to onboard. Documents prerequisites, quick-start, architecture, and links to detailed docs.
  - Deliverable: `README.md` at repo root
  - Depends on: TASK-scaffold-8
  - Assigned to: unassigned
  - Done criteria: README exists at repo root. Documents: prerequisites (Node 20+, pnpm 8+, Java 17+, Docker), quick-start steps (clone, .env, dev-up.sh), architecture overview (monorepo, React+NestJS+Spring Boot, Supabase, Upstash), directory structure, development commands (`pnpm dev`, `pnpm lint`, `pnpm test`, `pnpm build`), links to `docs/roadmap.md`, `docs/commit-conventions.md`, `docs/ci-cd.md`, `.kiro/steerings/00-project-context.md`, `.kiro/steerings/06-team-workflow.md`. All links are valid relative paths. Written in English.
