# Sprint Plan — Hackathon Delivery (Jul 21–27, 2026)

> **Deadline:** Sunday July 27, 2026
> **Start:** Tuesday July 21, 2026 (today)
> **Total tasks:** ~163 across 13 features
> **Target velocity:** ~27 tasks/day

## How to use this file

At the start of each session, the agent (or human) reads this file to know:
1. What day we're on
2. What's pending from yesterday
3. What to tackle today

Mark tasks as ✅ when done. If a day slips, carry forward to the next.

---

## Day 1 — Tuesday Jul 21: Scaffold monorepo + start auth

**Goal:** Complete `feature-scaffold-monorepo` (12 remaining tasks) + start `feature-admin-auth-core`.

### Scaffold tasks (in dependency order):

- [ ] TASK-scaffold-9: ESLint + Prettier configuration
- [ ] TASK-scaffold-4: Spring Boot payment-service scaffold
- [ ] TASK-scaffold-5: `packages/shared-types` with DTOs
- [ ] TASK-scaffold-2: React apps (landing + admin-dashboard)
- [ ] TASK-scaffold-3: NestJS api-core with `/health`
- [ ] TASK-scaffold-12: Git hooks (husky + lint-staged)
- [ ] TASK-scaffold-10: Testing framework (Vitest + Jest)
- [ ] TASK-scaffold-6: Docker Compose + Nginx
- [ ] TASK-scaffold-7: `.env.example` finalized
- [ ] TASK-scaffold-8: `dev-up.sh` verification
- [ ] TASK-scaffold-11: CI pipeline (lint+test+build)
- [ ] TASK-scaffold-13: Root README update

### Stretch (if time permits):

- [ ] TASK-auth-1: Migration for admin_users + refresh_tokens
- [ ] TASK-auth-2: Password hashing + AdminUser entity

---

## Day 2 — Wednesday Jul 22: Admin auth + Payment service core

**Goal:** Complete `feature-admin-auth-core` (15 tasks) + `feature-payment-billing-java` scaffold+PayPal (tasks 1–6).

### Admin auth:

- [ ] TASK-auth-1: Migration admin_users + refresh_tokens
- [ ] TASK-auth-2: Password hashing + AdminUser entity
- [ ] TASK-auth-3: POST /admin/auth/login (JWT + refresh cookie)
- [ ] TASK-auth-4: POST /admin/auth/refresh
- [ ] TASK-auth-5: POST /admin/auth/logout
- [ ] TASK-auth-6: Rate limiting (Redis)
- [ ] TASK-auth-7: Global JWT guard
- [ ] TASK-auth-8: Admin create/deactivate endpoints
- [ ] TASK-auth-9: LoginPage + useAuth controller
- [ ] TASK-auth-10: DashboardLayout with nav
- [ ] TASK-auth-11: Automatic refresh HTTP interceptor
- [ ] TASK-auth-12: CI workflow
- [ ] TASK-auth-test1: Unit tests auth domain
- [ ] TASK-auth-test2: Integration tests auth

### Payment service (foundation):

- [ ] TASK-pay-1: Spring Boot scaffold
- [ ] TASK-pay-2: DB connection + Flyway
- [ ] TASK-pay-3: JPA entities (Payment, Refund, Receipt, AuditLog)
- [ ] TASK-pay-4: Audit log aspect (@Audited)
- [ ] TASK-pay-5: PayPal Orders API integration
- [ ] TASK-pay-6: POST /payments/orders (initiate with idempotency)

---

## Day 3 — Thursday Jul 23: Catalog + Notifications + Payment webhooks

**Goal:** Complete `feature-catalog-landing` (9 tasks) + `feature-realtime-notifications` (12 tasks) + payment webhooks.

### Catalog landing:

- [ ] TASK-catalog-1: Migration + Prototype entity
- [ ] TASK-catalog-2: GET /catalog/prototypes endpoints
- [ ] TASK-catalog-3: Redis cache for listings
- [ ] TASK-catalog-4: SSE endpoint /catalog/stream
- [ ] TASK-catalog-5: catalogApi + useCatalog controller (frontend)
- [ ] TASK-catalog-6: CatalogGrid + PrototypeCard views
- [ ] TASK-catalog-7: PrototypeDetail + image gallery
- [ ] TASK-catalog-8: CatalogFilters + deactivation notice
- [ ] TASK-catalog-test1: Integration tests catalog

### Realtime notifications:

- [ ] TASK-notif-1: Migration admin_notifications
- [ ] TASK-notif-2: notifications module + notifyAdmins()
- [ ] TASK-notif-3: WebSocket Gateway with JWT auth
- [ ] TASK-notif-4: GET /admin/notifications endpoint
- [ ] TASK-notif-5: notification.mark_read event
- [ ] TASK-notif-7: useNotifications controller (socket + sound)
- [ ] TASK-notif-8: NotificationBell + NotificationPanel
- [ ] TASK-notif-9: Sound asset + on/off preference
- [ ] TASK-notif-10: Reconnection with backoff
- [ ] TASK-notif-test1: Unit tests notifications
- [ ] TASK-notif-test2: Integration tests WebSocket/SSE

### Payment (continued):

- [ ] TASK-pay-7: Webhook POST /payments/webhooks/paypal
- [ ] TASK-pay-8: Outgoing webhook to api-core

---

## Day 4 — Friday Jul 24: Direct purchase + Custom quote (start)

**Goal:** Complete `feature-direct-purchase` (13 tasks) + start `feature-custom-quote`.

### Direct purchase (Flow A):

- [ ] TASK-directpurchase-1: Migration orders table
- [ ] TASK-directpurchase-2: Order entity + state machine
- [ ] TASK-directpurchase-3: POST /orders endpoint
- [ ] TASK-directpurchase-4: HTTP client to payment-service
- [ ] TASK-directpurchase-5: Webhook endpoint payment-result
- [ ] TASK-directpurchase-6: Payment confirmation email
- [ ] TASK-directpurchase-7: WebSocket notification to admin
- [ ] TASK-directpurchase-8: PATCH /orders/:id/accept
- [ ] TASK-directpurchase-9: PATCH /orders/:id/reject + refund
- [ ] TASK-directpurchase-10: BullMQ reconciliation job
- [ ] TASK-directpurchase-11: Admin listing GET /orders
- [ ] TASK-directpurchase-12: Landing UI — Buy button + checkout
- [ ] TASK-directpurchase-13: Admin UI — Orders table + actions

### Custom quote (start — Flow B):

- [ ] TASK-quoteB-1: Migration quotes table
- [ ] TASK-quoteB-2: Quote entity + state machine
- [ ] TASK-quoteB-3: POST /quotes (customer request)
- [ ] TASK-quoteB-4: Admin pricing endpoint
- [ ] TASK-quoteB-5: Email to customer with quote + magic link

---

## Day 5 — Saturday Jul 25: Custom quote (finish) + Supply + Complaints

**Goal:** Finish `feature-custom-quote` + complete `feature-supply-stock-management` + complete `feature-complaints-refunds`.

### Custom quote (continued):

- [ ] TASK-quoteB-6 through TASK-quoteB-21: acceptance flow, payment window, expiration jobs, landing UI, admin views, tests

### Supply stock management:

- [ ] TASK-stock-1: Migration + Supply entity
- [ ] TASK-stock-2: CRUD endpoints
- [ ] TASK-stock-3: Excel parser + template
- [ ] TASK-stock-4: POST import-excel (preview)
- [ ] TASK-stock-5: POST import-excel/confirm
- [ ] TASK-stock-6: GET export-excel
- [ ] TASK-stock-7: BullMQ low-stock-check job
- [ ] TASK-stock-8: SuppliesTable + SupplyForm views
- [ ] TASK-stock-9: ExcelImportWizard view
- [ ] TASK-stock-10: Integration tests

### Complaints & refunds:

- [ ] TASK-complaint-1 through TASK-complaint-test2: all 12 tasks

---

## Day 6 — Sunday Jul 26: Quote admin + Deliveries + i18n + Payment finish

**Goal:** Complete remaining features: `feature-quote-management-admin`, `feature-order-delivery-schedule`, `feature-i18n-localization`, finish `feature-payment-billing-java`.

### Quote management admin:

- [ ] TASK-quoteadmin-1 through TASK-quoteadmin-test2: all 8 tasks

### Order delivery schedule:

- [ ] TASK-delivery-1 through TASK-delivery-test2: all 8 tasks

### i18n localization:

- [ ] TASK-i18n-1 through TASK-i18n-integration: all 10 tasks

### Payment billing (finish):

- [ ] TASK-pay-9 through TASK-pay-15: receipts, refund flow, integration test

---

## Day 7 — Sunday Jul 27 (AM): Infra + Final testing + Delivery

**Goal:** Complete `feature-infra-deploy` + final integration + package for delivery.

### Infrastructure:

- [ ] TASK-infra-1 through TASK-infra-test2: all 14 tasks

### Final checklist:

- [ ] All features pass CI
- [ ] Docker Compose starts all services cleanly
- [ ] Seed data populates all tables
- [ ] Manual smoke test: Flow A (buy → pay → accept/reject)
- [ ] Manual smoke test: Flow B (quote → price → accept → pay)
- [ ] README is complete and accurate
- [ ] No secrets committed
- [ ] Package/zip for delivery

---

## Notes

- TASK-notif-6 (integrate notifyAdmins across modules) is cross-cutting — done incrementally as each module that uses it is built.
- TASK-auth-13 (lockout notification) depends on TASK-notif-3 — done on Day 3 with notifications.
- If a day falls behind, the FIRST thing to cut is unit/integration tests (mark as tech debt). Core functionality > test coverage for delivery.
- Payment service (Java) is independent — can be worked on in parallel sessions.
