# Feature status

This file tracks the implementation status of each feature.
Last updated: 2026-07-24

| Feature                            | Status         | Tasks | PR(s)          |
| ---------------------------------- | -------------- | ----- | -------------- |
| `feature-scaffold-monorepo`        | ✅ Complete    | 13/13 | (pre-existing) |
| `feature-admin-auth-core`          | ✅ Complete    | 9/9   | (pre-existing) |
| `feature-catalog-landing`          | ✅ Complete    | 9/9   | (pre-existing) |
| `feature-realtime-notifications`   | ✅ Complete    | 12/12 | (pre-existing) |
| `feature-direct-purchase`          | ✅ Complete    | 15/15 | (pre-existing) |
| `feature-custom-quote`             | ✅ Complete    | 22/22 | #10, #11       |
| `feature-supply-stock-management`  | ✅ Complete    | 10/10 | #12            |
| `feature-payment-billing-java`     | ✅ Complete    | 15/15 | (pre-existing) |
| `feature-quote-management-admin`   | ✅ Complete    | 8/8   | #10, #11       |
| `feature-order-delivery-schedule`  | ✅ Complete    | 8/8   | #16            |
| `feature-complaints-refunds`       | ✅ Complete    | 11/11 | #14            |
| `feature-i18n-localization`        | ✅ Complete    | 8/8   | #20            |
| `feature-infra-deploy`             | 🟡 In Progress | 10/14 | #21, #23       |
| `feature-admin-catalog-crud`       | ✅ Complete    | 3/3   | #25            |
| `feature-job-queue-infrastructure` | ✅ Complete    | 3/3   | #24            |
| `feature-structured-logging`       | ✅ Complete    | —     | #27            |
| `feature-ui-overhaul`              | ✅ Complete    | —     | #28            |

## Issues resolved

| Issue | Description                                             | PR  |
| ----- | ------------------------------------------------------- | --- |
| #15   | Remove all production mocks — wire real Redis + Mailjet | #26 |
| #17   | Frontend UI/UX overhaul                                 | #28 |
| #18   | Branding fix (Modula → ModulApp) + docs sync            | —   |

## Remaining work

### feature-infra-deploy (4 tasks remaining)

- [ ] Extended CI pipeline (Docker + Maven build jobs)
- [ ] Docker image push to ECR/registry
- [ ] `scripts/prod-up.sh` production startup script
- [ ] Full integration test with Docker Compose

## Architecture additions (Day 4)

- **RedisModule** (global): Shared Upstash Redis client — replaces all mock stubs
- **QueueModule** (BullMQ): 3 queues (scheduled-jobs, payment-webhook, email-send)
- **LoggerModule** (Pino): Structured JSON logging with request correlation
- **AdminCatalogCRUD**: Full prototype management from dashboard
- **HelpPanel**: Admin documentation accessible from dashboard
