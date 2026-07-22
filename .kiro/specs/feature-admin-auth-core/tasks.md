# Tasks: Admin auth and base dashboard layout

## Group A — Data layer + entities

- [x] TASK-auth-1: Prisma migration for `admin_users` and `refresh_tokens` tables + `AdminUser` entity with password hashing (argon2)
  - Context: FR1 (admin login requires an admin entity), FR2 (multiple admins with same permissions), NFR (passwords hashed with argon2, never plain text). Creates the data foundation for the entire auth feature.
  - Deliverable:
    - `services/api-core/prisma/migrations/<timestamp>_create_admin_auth_tables/migration.sql`
    - `services/api-core/src/domain/auth/entities/admin-user.entity.ts`
    - `services/api-core/src/domain/auth/entities/refresh-token.entity.ts`
    - `services/api-core/src/infrastructure/auth/repositories/admin-user.repository.ts`
    - `services/api-core/src/infrastructure/auth/repositories/refresh-token.repository.ts`
    - Unit tests embedded: `services/api-core/src/domain/auth/entities/admin-user.entity.spec.ts`
  - Depends on: none
  - Assigned to: unassigned
  - Done criteria: `prisma migrate dev` creates both tables with correct schema. Unit tests pass: `unit.admin-user.create.validHash`, `unit.admin-user.create.rejectsPlainText`, `unit.admin-user.verifyPassword.correctHash`, `unit.admin-user.verifyPassword.wrongHash`, `unit.refresh-token.create.setsExpiry`, `unit.refresh-token.isExpired.true`, `unit.refresh-token.isExpired.false`.

## Group B — Auth endpoints (login / refresh / logout)

- [x] TASK-auth-2: Login, refresh, and logout endpoints with JWT generation and refresh cookie
  - Context: FR1 (login with email + password, proprietary JWT), FR5 (session expires via refresh token, explicit logout). These three endpoints form the core auth flow. Login returns a short-lived access JWT (~15 min) + sets a long-lived httpOnly refresh cookie. Refresh exchanges a valid refresh token for a new access JWT. Logout revokes the refresh token.
  - Deliverable:
    - `services/api-core/src/interface/auth/controllers/auth.controller.ts`
    - `services/api-core/src/interface/auth/dto/login-request.dto.ts`
    - `services/api-core/src/interface/auth/dto/login-response.dto.ts`
    - `services/api-core/src/application/auth/use-cases/login.use-case.ts`
    - `services/api-core/src/application/auth/use-cases/refresh.use-case.ts`
    - `services/api-core/src/application/auth/use-cases/logout.use-case.ts`
    - `services/api-core/src/infrastructure/auth/jwt/jwt.service.ts`
    - `services/api-core/src/infrastructure/auth/jwt/refresh-cookie.service.ts`
    - Unit tests embedded: `services/api-core/src/application/auth/use-cases/login.use-case.spec.ts`, `services/api-core/src/application/auth/use-cases/refresh.use-case.spec.ts`, `services/api-core/src/application/auth/use-cases/logout.use-case.spec.ts`
  - Depends on: TASK-auth-1
  - Assigned to: unassigned
  - Done criteria: Unit tests pass: `unit.login.validCredentialsReturnsJWTAndCookie`, `unit.login.invalidCredentialsReturns401`, `unit.login.deactivatedUserReturns403`. `unit.refresh.validTokenReturnsNewJWT`, `unit.refresh.expiredTokenThrows`, `unit.refresh.revokedTokenThrows`. `unit.logout.revokesRefreshToken`, `unit.logout.clearsCookie`. Endpoints respond correctly via `curl`.

## Group C — Middleware (rate limiting + JWT guard)

- [x] TASK-auth-3: Rate limiting on login endpoint (Redis) + global JWT guard for `/admin/**` routes
  - Context: NFR (rate limiting on login for brute force mitigation), NFR (all dashboard routes except login require a valid JWT), edge case (repeated failed login attempts → temporary lockout). Rate limit is 5 attempts per 15 min per IP+email via Redis. JWT guard protects all `/admin/**` routes except `/admin/auth/login` and `/admin/auth/refresh`.
  - Deliverable:
    - `services/api-core/src/interface/auth/guards/rate-limit.guard.ts`
    - `services/api-core/src/infrastructure/auth/rate-limit/rate-limit.service.ts`
    - `services/api-core/src/interface/auth/guards/jwt-auth.guard.ts`
    - `services/api-core/src/interface/auth/decorators/current-admin.decorator.ts`
    - Unit tests embedded: `services/api-core/src/infrastructure/auth/rate-limit/rate-limit.service.spec.ts`, `services/api-core/src/interface/auth/guards/jwt-auth.guard.spec.ts`
  - Depends on: TASK-auth-2
  - Assigned to: unassigned
  - Done criteria: Unit tests pass: `unit.rate-limit.incrementAndCount`, `unit.rate-limit.blocksAfterMaxAttempts`, `unit.rate-limit.resetsAfterWindow`. `unit.jwt-guard.validTokenAllowsRequest`, `unit.jwt-guard.missingTokenRedirectsToLogin`, `unit.jwt-guard.expiredTokenRedirectsToLogin`. Login endpoint returns 429 after 5 failed attempts within 15 min. Unauthenticated request to any `/admin/**` route (except login/refresh) returns 401.

## Group D — Admin management endpoints

- [x] TASK-auth-4: Admin create and deactivate endpoints
  - Context: FR3 (basic admin management: create by another logged-in admin, deactivate). Creates admin management endpoints behind JWT auth. Only logged-in admins can create new admins or deactivate existing ones.
  - Deliverable:
    - `services/api-core/src/interface/auth/controllers/admin-user.controller.ts`
    - `services/api-core/src/interface/auth/dto/create-admin.dto.ts`
    - `services/api-core/src/application/auth/use-cases/create-admin.use-case.ts`
    - `services/api-core/src/application/auth/use-cases/deactivate-admin.use-case.ts`
    - Unit tests embedded: `services/api-core/src/application/auth/use-cases/create-admin.use-case.spec.ts`, `services/api-core/src/application/auth/use-cases/deactivate-admin.use-case.spec.ts`
  - Depends on: TASK-auth-1
  - Assigned to: unassigned
  - Done criteria: Unit tests pass: `unit.create-admin.validInputCreatesAdmin`, `unit.create-admin.duplicateEmailThrows`, `unit.create-admin.hashPasswordBeforeSaving`. `unit.deactivate-admin.deactivatesUser`, `unit.deactivate-admin.deactivatedUserCannotLogin`. Acceptance criteria: deactivated admin cannot log in even with correct password.

## Group E — Frontend (login + layout + interceptor)

- [ ] TASK-auth-5: Login page, useAuth controller, and dashboard layout with section navigation
  - Context: FR1 (admin login UI), FR4 (base dashboard layout with navigation to sections: catalog, purchases/orders, quotes, stock/supplies, complaints/refunds, notifications; responsive). Builds the React frontend for the admin auth flow. Login page with email/password form. Dashboard layout with collapsible sidebar nav (mobile-first, Tailwind breakpoints). Route guard: no valid JWT → redirect to `/login`.
  - Deliverable:
    - `apps/admin-dashboard/src/views/LoginPage.tsx`
    - `apps/admin-dashboard/src/views/LoginPage.test.tsx`
    - `apps/admin-dashboard/src/controllers/useAuth.ts`
    - `apps/admin-dashboard/src/controllers/useAuth.test.ts`
    - `apps/admin-dashboard/src/models/auth.ts`
    - `apps/admin-dashboard/src/views/DashboardLayout.tsx`
    - `apps/admin-dashboard/src/views/DashboardLayout.test.tsx`
    - `apps/admin-dashboard/src/views/components/SideNav.tsx`
    - `apps/admin-dashboard/src/views/components/SideNav.test.tsx`
    - `apps/admin-dashboard/src/views/components/RouteGuard.tsx`
    - `apps/admin-dashboard/src/views/components/RouteGuard.test.tsx`
  - Depends on: TASK-auth-2
  - Assigned to: unassigned
  - Done criteria: Login page renders email/password fields, calls `useAuth.login()`, shows loading/error states. Dashboard layout renders side nav with links to all 6 sections. RouteGuard redirects unauthenticated users to `/login`. Mobile sidebar collapses at `sm` breakpoint. All frontend unit tests pass (Vitest).

- [ ] TASK-auth-6: Automatic refresh HTTP interceptor in admin frontend
  - Context: FR5 (session expires → silent refresh; if refresh also expired → redirect to login without losing draft state). Adds an Axios/fetch interceptor that intercepts 401 responses, attempts a silent refresh via `POST /admin/auth/refresh`, and retries the original request. If refresh fails, redirects to `/login` while preserving local state (e.g., half-filled form in component state).
  - Deliverable:
    - `apps/admin-dashboard/src/models/http-client.ts`
    - `apps/admin-dashboard/src/models/http-client.test.ts`
    - `apps/admin-dashboard/src/controllers/useAuth.ts` (update to integrate interceptor)
  - Depends on: TASK-auth-5
  - Assigned to: unassigned
  - Done criteria: Unit tests pass: `unit.http-client.interceptor.retriesOn401AfterRefresh`, `unit.http-client.interceptor.redirectsToLoginOnRefreshFailure`, `unit.http-client.interceptor.preservesRequestOnRetry`. 401 response triggers automatic refresh. If refresh succeeds, original request is retried. If refresh fails, user is redirected to `/login`.

## Group F — Notification on lockout

- [ ] TASK-auth-7: Notification to affected admin on rate-limit lockout
  - Context: edge case in specs.md requires "temporary lockout + notification" on repeated failed login attempts. TASK-auth-3 implements the lockout itself; this task sends a notification to the affected admin when lockout triggers (via WebSocket if connected, or email as fallback).
  - Deliverable:
    - `services/api-core/src/application/auth/use-cases/notify-lockout.use-case.ts`
    - `services/api-core/src/application/auth/use-cases/notify-lockout.use-case.spec.ts`
    - `services/api-core/src/infrastructure/auth/notifications/lockout-notification.service.ts`
  - Depends on: TASK-auth-3
  - Assigned to: unassigned
  - Done criteria: When rate limit blocks an admin, a notification is sent with message "Multiple failed login attempts detected. Account temporarily locked." Notification is persisted in `admin_notifications` table. Unit tests pass: `unit.notify-lockout.sendsWebSocketNotification`, `unit.notify-lockout.fallsBackToEmail`, `unit.notify-lockout.persistsNotification`.

## Group G — CI verification

- [ ] TASK-auth-8: Verify CI pipeline runs correctly with auth module code
  - Context: CI is already created by TASK-scaffold-11 (feature-scaffold-monorepo) with lint + test + build for all workspaces. This task verifies that the auth module's code (entities, services, controllers, guards) passes CI cleanly. No new CI file is created — the existing pipeline must work with auth code.
  - Depends on: TASK-scaffold-11 (feature-scaffold-monorepo), TASK-auth-1
  - Assigned to: unassigned
  - Done criteria: Push a branch with auth module code triggers CI. Lint passes (auth module files have zero ESLint errors). Tests pass (auth unit tests run and pass). Build succeeds (api-core compiles with auth module). CI status shows green on the PR. If any auth code fails CI, fix it before marking this task done.

## Group H — Integration tests (cross-cutting)

- [ ] TASK-auth-9: Integration tests for full auth flow and JWT guard protection
  - Context: validates the complete login → refresh → logout flow, rate limiting behavior, and JWT guard protection end-to-end. Uses Supertest against NestJS test app with mocked Redis for rate limiting. This is the single integration test task for the entire auth feature.
  - Deliverable:
    - `services/api-core/src/modules/auth/auth.integration-spec.ts`
  - Depends on: TASK-auth-1, TASK-auth-2, TASK-auth-3, TASK-auth-4
  - Assigned to: unassigned
  - Done criteria: All integration tests pass: `integration.auth.login.successReturnsJWTAndCookie`, `integration.auth.login.invalidCredentialsReturns401`, `integration.auth.login.deactivatedAdminReturns403`, `integration.auth.login.rateLimitBlocksAfter5Attempts`. `integration.auth.refresh.validTokenReturnsNewJWT`, `integration.auth.refresh.expiredTokenRedirectsToLogin`, `integration.auth.refresh.revokedTokenReturns401`. `integration.auth.logout.revokesRefreshToken`, `integration.auth.logout.clearsCookie`. `integration.auth.guard.blocksRequestWithoutJWT`, `integration.auth.guard.allowsRequestWithValidJWT`. `integration.auth.admin.createRequiresJWT`, `integration.auth.admin.createCreatesNewAdmin`, `integration.auth.admin.deactivatePreventsLogin`. `integration.auth.lockout.notificationSentOnLockout`.
