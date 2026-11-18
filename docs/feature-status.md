# Feature status

This file tracks the implementation status of each feature.
Last updated: 2026-11-15

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
| `feature-infra-deploy`             | ✅ Complete    | 14/14 | #21, #23       |
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

None tracked. `feature-infra-deploy` is closed by the **Render free-tier** deployment
(3 web services) with **CI-gated deploys**, backed by **Neon** (Postgres) and
**Upstash** (Redis).

### Deployment (current)

- Hosting: Render free tier — `modula-web` (front-door), `modula-api`, `modula-payment`.
- Database: Neon (2 databases). Redis: Upstash (REST for cache, TCP for BullMQ).
- CI-gated deploy: `.github/workflows/ci.yml` job `deploy` (Render API) runs only after
  the `lint-test-build` quality gate passes on a push to `main`.
- Public URL: https://modulapp.artisandevs.site

> The old AWS/Terraform tasks (ECR push, Maven CI job, `scripts/prod-up.sh`) are
> **obsolete** — see `docs/terraform-guide.md` (legacy).

## Architecture additions (Day 4)

- **RedisModule** (global): Shared Upstash Redis client — replaces all mock stubs
- **QueueModule** (BullMQ): 3 queues (scheduled-jobs, payment-webhook, email-send)
- **LoggerModule** (Pino): Structured JSON logging with request correlation
- **AdminCatalogCRUD**: Full prototype management from dashboard
- **HelpPanel**: Admin documentation accessible from dashboard
