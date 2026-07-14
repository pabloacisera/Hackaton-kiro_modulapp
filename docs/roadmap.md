# Roadmap and features

This document is for human developers — the equivalent for the agent lives in
`.kiro/specs/`.

## Features (suggested implementation order)

**Phase 0 — Foundation (must complete first)**

0. `feature-scaffold-monorepo` — monorepo setup, app scaffolding, docker-compose

**Phase 1 — Core services (can overlap)**

1. `feature-admin-auth-core` — base to protect everything else
2. `feature-catalog-landing` — public catalog
3. `feature-payment-billing-java` — parallel, no dependencies
4. `feature-realtime-notifications` — integrated cross-cutting from here

**Phase 2 — Business flows (depend on Phase 1)**

5. `feature-direct-purchase` (Flow A) — needs payment, catalog, notifications
6. `feature-custom-quote` (Flow B) — needs payment
7. `feature-supply-stock-management` — needs notifications

**Phase 3 — Admin & orchestration (depend on Phase 2)**

8. `feature-quote-management-admin` — needs custom-quote entities
9. `feature-order-delivery-schedule` — needs both flows' entities
10. `feature-complaints-refunds` — needs payment

**Phase 4 — Polish (last)**

11. `feature-i18n-localization` — needs all business features
12. `feature-infra-deploy` (CI/CD, production deploy) — needs all features for seed data

## Dependency notes

| Feature | Depends on | Reason |
|---|---|---|
| `feature-scaffold-monorepo` | none | Foundation — creates all apps and services |
| `feature-admin-auth-core` | scaffold-monorepo | Needs NestJS and React apps to exist |
| `feature-catalog-landing` | scaffold-monorepo | Needs React app and NestJS endpoints |
| `feature-payment-billing-java` | scaffold-monorepo | Needs Spring Boot app to exist |
| `feature-realtime-notifications` | admin-auth-core (partial) | WebSocket JWT auth needs auth module |
| `feature-direct-purchase` | payment-billing-java, catalog-landing | Needs payment processing and catalog entities |
| `feature-custom-quote` | payment-billing-java | Needs payment processing for acceptance flow |
| `feature-supply-stock-management` | realtime-notifications (partial) | Low-stock alerts need WebSocket notifications |
| `feature-quote-management-admin` | custom-quote | Quote entity and state machine must exist |
| `feature-order-delivery-schedule` | direct-purchase, custom-quote | Needs order and quote entities |
| `feature-complaints-refunds` | payment-billing-java (partial) | Refund processing needs payment service |
| `feature-i18n-localization` | direct-purchase, custom-quote, complaints-refunds | Needs all business features for translation coverage |
| `feature-infra-deploy` | admin-auth-core (CI), all features (seed) | CI pipeline and complete seed data |

## Open questions / pending business decisions

- Flow A: is there a deadline for the admin to accept/reject a paid order,
  or does it stay pending indefinitely? Current design does not enforce
  anything — the owner must confirm if they want an internal SLA (e.g.,
  alert if 24h pass without admin resolution). Without an SLA, an order
  stuck in `paid_pending_acceptance` never appears in the unified
  `DeliveryItem` projection (`feature-order-delivery-schedule`), because
  that view only includes `orders.accepted` and `quotes.paid`.
- Email provider: **Mailjet** has been decided (see `00-project-context.md`).
- Define if `payment-service` runs in PayPal sandbox mode until what point
  in development, and when "live" credentials are requested.

## Feature status

See `docs/feature-status.md` (updated as `tasks.md` of each feature are
closed — maintained by the `on-task-completed` hook).
