# Sprint Plan — Hackathon Delivery (Jul 21–27, 2026)

> **Deadline:** Sunday July 27, 2026
> **Start:** Tuesday July 21, 2026
> **Total tasks:** ~156 across 13 features
> **Progress:** 115/156 (74%) as of Day 3 (Thu Jul 23)

## How to use this file

At the start of each session, the agent (or human) reads this file to know:

1. What day we're on
2. What's pending from yesterday
3. What to tackle today

Mark tasks as ✅ when done. If a day slips, carry forward to the next.

---

## Day 1 — Tuesday Jul 21: Scaffold monorepo + start auth ✅ DONE

**Goal:** Complete `feature-scaffold-monorepo` + start `feature-admin-auth-core`.

- ✅ TASK-scaffold-1→13: All scaffold tasks complete
- ✅ TASK-auth-1, TASK-auth-2: Started auth

---

## Day 2 — Wednesday Jul 22: Admin auth + Payment service core ✅ DONE

**Goal:** Complete `feature-admin-auth-core` + `feature-payment-billing-java` + `feature-catalog-landing` + `feature-realtime-notifications` + `feature-direct-purchase`.

- ✅ TASK-auth-1→9: All auth tasks complete
- ✅ TASK-pay-1→15: All payment-service tasks complete
- ✅ TASK-catalog-1→8: Catalog landing (8/9 — integration test pending)
- ✅ TASK-notif-1→4, 6, 7, 8, test1: Notifications (8/12)
- ✅ TASK-directpurchase-1→13, test1, test2: Direct purchase complete

---

## Day 3 — Thursday Jul 23: Custom quote + Supply + Complaints + Deliveries ✅ DONE

**Goal:** Complete `feature-custom-quote`, `feature-supply-stock-management`, `feature-complaints-refunds`, `feature-order-delivery-schedule` + integration gaps fix.

### Custom quote (Flow B): ✅ Complete (22/22)

- ✅ TASK-quoteB-1→16, webhook, test1, test2: Backend complete (PR #10)
- ✅ TASK-quoteB-17, 18, 19: Frontend complete (PR #11)

### Supply stock management: ✅ Complete (10/10)

- ✅ TASK-stock-1→10: All tasks including Upstash Redis (PR #12)

### Complaints & refunds: 🟡 10/11

- ✅ TASK-complaint-1→9, test1: All except integration test (PR #14)
- [ ] TASK-complaint-test2: Integration test (pending)

### Order delivery schedule: 🟡 7/8

- ✅ TASK-delivery-1→6, test1: All except integration test (PR #16)
- [ ] TASK-delivery-test2: Integration test (pending)

### Integration fix: ✅ (PR #15)

- ✅ AcceptQuoteUseCase → PaymentServiceClient (real call)
- ✅ ApproveRefundUseCase → PaymentServiceClient (real call)
- ✅ Landing App.tsx → react-router with all pages
- ✅ Admin App.tsx → react-router with protected routes
- ✅ SeedService → 5 sample prototypes on dev startup

### Also:

- ✅ CI fix: unused imports TS6133 (PR #13)
- ✅ Documentation update (PR #17)

---

## Day 4 — Friday Jul 24: Remaining gaps + i18n (start)

**Goal:** Close all pending integration tests + start `feature-i18n-localization`.

### Pending integration tests:

- [ ] TASK-catalog-test1: Integration test for catalog
- [ ] TASK-complaint-test2: Integration test for complaints
- [ ] TASK-delivery-test2: Integration test for deliveries
- [ ] TASK-notif-test2: Integration test for notifications

### Realtime notifications gaps:

- [ ] TASK-notif-5: mark_read event propagation
- [ ] TASK-notif-9: Sound asset + on/off preference
- [ ] TASK-notif-10: Reconnection with exponential backoff

### i18n localization (start):

- [ ] TASK-i18n-1 through TASK-i18n-8: Translation framework + locale files

---

## Day 5 — Saturday Jul 25: i18n (finish) + Infra deploy (start)

**Goal:** Finish `feature-i18n-localization` + start `feature-infra-deploy`.

### i18n (continued):

- [ ] Remaining i18n tasks

### Infra deploy:

- [ ] TASK-infra-9: Extended CI (Docker + Maven build)
- [ ] TASK-infra-10: Docker image push
- [ ] TASK-infra-11: docs/deployment.md
- [ ] TASK-infra-12: scripts/prod-up.sh
- [ ] TASK-infra-test1: Docker Compose integration test
- [ ] TASK-infra-test2: CI pipeline validation

---

## Day 6 — Sunday Jul 26 (AM): Final testing + Delivery

**Goal:** Complete `feature-infra-deploy` + final integration + package for delivery.

### Final checklist:

- [ ] All features pass CI
- [ ] Docker Compose starts all services cleanly
- [ ] Seed data populates all tables
- [ ] Manual smoke test: Flow A (buy → pay → accept/reject)
- [ ] Manual smoke test: Flow B (quote → price → accept → pay)
- [ ] Manual smoke test: Flow C (complaint → review → refund)
- [ ] README is complete and accurate
- [ ] No secrets committed
- [ ] Package/zip for delivery

---

## Notes

- Day 3 velocity was exceptional: 4 complete features + integration fix in one session
- Integration tests (4 pending) are low-effort tasks, ~30 min each
- `feature-i18n-localization` is the largest remaining block (10 tasks, not started)
- `feature-infra-deploy` has 6 remaining tasks (mostly docs + CI extension)
- Payment service (Java) is 100% complete — no remaining work
- Total test count: 344 passing (172 api-core + 69 landing + 95 admin + 8 delivery)
