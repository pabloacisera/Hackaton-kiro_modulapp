# Specs: Job Queue Infrastructure (BullMQ)

## What it is

Reliable job queue infrastructure using BullMQ + Redis that guarantees no work is lost under high concurrency or server saturation. Replaces the fragile `setInterval`-based scheduling with proper persistent queues, automatic retries, dead-letter handling, and environment-aware configuration (local Redis for dev, Upstash Redis for production).

## Why it matters

The current implementation uses `setInterval` for all scheduled/background work:

- If the server restarts, in-flight jobs are lost.
- Under high concurrency (many simultaneous PayPal webhooks, document generation requests), there's no backpressure — the server can be overwhelmed.
- No retry mechanism for transient failures (network errors, external API timeouts).
- No visibility into failed jobs or dead-letter queue.

## Business flows that benefit

1. **Payment webhook processing**: PayPal webhooks must be acknowledged quickly (< 5s) but processing (state transitions, receipt generation, notifications) can be deferred to the queue.
2. **Document generation (receipts/PDFs)**: CPU-intensive, should not block the main request thread.
3. **Email sending**: Transient Mailjet failures should be retried, not lost.
4. **Quote/payment expiration checks**: Currently `setInterval` — if missed, quotes stay in wrong state.
5. **Stock alerts**: Hourly check that should survive server restarts.
6. **Payment reconciliation**: Periodic check for hung payments.

## Functional requirements

- FR1. BullMQ module configured with environment-aware Redis connection:
  - **Local dev**: Redis container from docker-compose (`redis://localhost:6379`)
  - **Production**: Upstash Redis (TLS connection via `UPSTASH_REDIS_URL`)
- FR2. Migrate existing `setInterval`-based jobs to BullMQ repeatable jobs:
  - `quote-expiration-check` (every 15 min)
  - `quote-payment-expiration-check` (every 15 min)
  - `payment-reconciliation` (every 5 min)
  - `low-stock-check` (every 1 hour)
- FR3. New event-driven queues for high-concurrency operations:
  - `payment-webhook` queue: processes incoming payment webhooks asynchronously
  - `email-send` queue: handles all transactional email sending with retry
- FR4. Retry policy: 3 attempts with exponential backoff (1s, 4s, 16s). After exhaustion, move to dead-letter queue.
- FR5. Concurrency control: configurable workers per queue (default: 3 for payment-webhook, 2 for email-send, 1 for scheduled jobs).
- FR6. Graceful shutdown: drain queues on SIGTERM, finish in-progress jobs before exit.

## Non-functional requirements

- BullMQ dashboard (Bull Board) available at `/admin/queues` in dev only (disabled in production or protected behind auth).
- Zero job loss: all jobs survive server restarts (Redis persistence).
- Observability: log job start, completion, and failure with job ID and duration.
- No breaking change to existing API contracts — queues are internal infrastructure.

## Edge cases

- Redis connection lost temporarily → BullMQ auto-reconnects; jobs are not lost (they're in Redis, not in-memory).
- Same webhook arrives twice (PayPal retry) → idempotency is handled at the processor level (existing idempotency_key logic), not at the queue level.
- Server crashes mid-job → job stays in Redis as "active", BullMQ's stalled job detection picks it up and retries.
- Upstash rate limit hit → backoff and retry (Upstash has generous limits for BullMQ patterns).

## Acceptance criteria

- All existing `setInterval` jobs replaced with BullMQ repeatable jobs.
- Payment webhook endpoint responds 200 immediately and processes asynchronously via queue.
- Email send failures are retried up to 3 times before landing in dead-letter queue.
- `docker compose up` in dev starts Redis and all queues work out of the box.
- Production config uses `UPSTASH_REDIS_URL` with TLS.
- Server restart does not lose any pending jobs.
