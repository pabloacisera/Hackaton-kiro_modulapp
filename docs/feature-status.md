# Feature status

This file tracks the implementation status of each feature.
Last updated: 2026-07-23

| Feature                           | Status         | Tasks | PR                    |
| --------------------------------- | -------------- | ----- | --------------------- |
| `feature-scaffold-monorepo`       | ✅ Complete    | 13/13 | (pre-existing)        |
| `feature-admin-auth-core`         | ✅ Complete    | 9/9   | (pre-existing)        |
| `feature-catalog-landing`         | 🟡 In Progress | 8/9   | (pre-existing)        |
| `feature-realtime-notifications`  | ✅ Complete    | 12/12 | (pre-existing)        |
| `feature-direct-purchase`         | ✅ Complete    | 15/15 | (pre-existing)        |
| `feature-custom-quote`            | ✅ Complete    | 22/22 | #10, #11              |
| `feature-supply-stock-management` | ✅ Complete    | 10/10 | #12                   |
| `feature-payment-billing-java`    | ✅ Complete    | 15/15 | (pre-existing)        |
| `feature-quote-management-admin`  | ✅ Complete    | 8/8   | (covered by #10, #11) |
| `feature-order-delivery-schedule` | 🟡 In Progress | 7/8   | #16                   |
| `feature-complaints-refunds`      | 🟡 In Progress | 10/11 | #14                   |
| `feature-i18n-localization`       | ❌ Pending     | 0/10  | —                     |
| `feature-infra-deploy`            | 🟡 In Progress | 8/14  | —                     |

## Remaining work

### ~~Missing integration tests~~ ✅ All done (PR #18)

### ~~feature-realtime-notifications~~ ✅ Complete (12/12)

All tasks verified as implemented: mark_read in gateway, Web Audio sound with debounce + localStorage, reconnection with exponential backoff in useNotifications.

### feature-i18n-localization (10 tasks — not started):

- Full i18n framework, locale files, component wiring

### feature-infra-deploy (6 tasks remaining):

- Extended CI (Docker + Maven build jobs)
- Docker image push to registry
- `docs/deployment.md`
- `scripts/prod-up.sh`
- Integration tests for Docker Compose
