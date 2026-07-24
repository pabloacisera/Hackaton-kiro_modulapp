# Tasks: Job Queue Infrastructure (BullMQ)

- [ ] TASK-queue-1: BullMQ module setup with environment-aware Redis connection factory
  - Context: FR1 — BullMQ must connect to local Redis (docker-compose) in dev and Upstash (TLS) in production. The `@nestjs/bull` package is already in package.json but never configured. Need to create the module, connection factory, constants, and register queues.
  - Deliverable: `apps/api-core/src/infrastructure/queue/queue.module.ts`, `apps/api-core/src/infrastructure/queue/queue-config.factory.ts`, `apps/api-core/src/infrastructure/queue/queue.constants.ts`, Redis service added to `infra/docker/docker-compose.yml` if missing, module imported in `app.module.ts`.
  - Depends on: none
  - Assigned to: unassigned
  - Done criteria: Unit test for `queue-config.factory` verifies: when `UPSTASH_REDIS_URL` is set, returns TLS-enabled IORedis config; when not set, returns localhost:6379 config. Module compiles and registers 3 queues (scheduled-jobs, payment-webhook, email-send). Redis container starts with `docker compose up`.

- [ ] TASK-queue-2: Scheduled jobs processor + migrate existing interval-based jobs to BullMQ repeatable
  - Context: FR2 — Replace `setInterval` in `PaymentReconciliationJob`, `QuoteExpirationJob`, and `LowStockCheckJob` with BullMQ repeatable jobs. The business logic inside each job stays unchanged; only the scheduling mechanism changes. Add repeatable job registration on module init.
  - Deliverable: `apps/api-core/src/infrastructure/queue/processors/scheduled-jobs.processor.ts`, modified `PaymentReconciliationJob` (remove setInterval), modified `QuoteExpirationJob` (expose methods only), modified `LowStockCheckJob` (expose methods only), job registration in queue module.
  - Depends on: TASK-queue-1
  - Assigned to: unassigned
  - Done criteria: Unit tests pass for: scheduled-jobs processor dispatches to correct job handler by job name, repeatable jobs are registered on module init (quote-expiration every 15m, payment-reconciliation every 5m, low-stock every 1h). `PaymentReconciliationJob` no longer uses `setInterval`. All existing job unit tests continue to pass.

- [ ] TASK-queue-3: Payment webhook + email send processors with retry and dead-letter
  - Context: FR3, FR4, FR5 — New processors for event-driven queues. Payment webhook queue processes incoming webhooks asynchronously (endpoint enqueues, responds 200 immediately). Email send queue handles Mailjet dispatch with retry. Both use exponential backoff (1s, 4s, 16s) and dead-letter after 3 failures. Graceful shutdown enabled.
  - Deliverable: `apps/api-core/src/infrastructure/queue/processors/payment-webhook.processor.ts`, `apps/api-core/src/infrastructure/queue/processors/email-send.processor.ts`, modified webhook controller to enqueue instead of process synchronously, graceful shutdown hooks in `main.ts`.
  - Depends on: TASK-queue-1
  - Assigned to: unassigned
  - Done criteria: Unit tests pass for: payment-webhook processor calls HandlePaymentWebhookUseCase with correct payload, email-send processor calls email service with correct params, retry config is 3 attempts with exponential backoff, failed jobs after 3 attempts remain in failed state (dead-letter). Webhook endpoint returns 200 immediately without waiting for processing. Integration test verifies: enqueue → process → state change occurs.
