# Roadmap and features

This document is for human developers — the equivalent for the agent lives in
`.kiro/specs/`.

## Features (suggested implementation order)

1. `feature-admin-auth-core` — base to protect everything else
2. `feature-catalog-landing`
3. `feature-supply-stock-management`
4. `feature-realtime-notifications` — integrated cross-cutting from here
5. `feature-direct-purchase` (Flow A)
6. `feature-custom-quote` (Flow B)
7. `feature-payment-billing-java` — parallel, required by 5 and 6
8. `feature-quote-management-admin`
9. `feature-order-delivery-schedule`
10. `feature-complaints-refunds`
11. `feature-i18n-localization`
12. `feature-infra-deploy` — starts parallel from day 1, not at the end

## Open questions / pending business decisions

- Flow A: is there a deadline for the admin to accept/reject a paid order,
  or does it stay pending indefinitely? Current design does not enforce
  anything — the owner must confirm if they want an internal SLA (e.g.,
  alert if 24h pass without admin resolution).
- Email provider: **Mailjet** has been decided (see `00-project-context.md`).
- Define if `payment-service` runs in PayPal sandbox mode until what point
  in development, and when "live" credentials are requested.

## Feature status

See `docs/feature-status.md` (updated as `tasks.md` of each feature are
closed — maintained by the `on-task-completed` hook).
