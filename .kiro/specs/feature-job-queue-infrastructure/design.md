# Design: Job Queue Infrastructure (BullMQ)

## Architecture

```
┌──────────────┐       ┌───────────────────────────────────────────────┐
│   api-core   │       │                Redis (BullMQ)                  │
│              │       │                                               │
│  Controller  │──────►│  Queue: payment-webhook                       │
│  (webhook)   │ enqueue│  Queue: email-send                           │
│              │       │  Queue: scheduled-jobs (repeatable)            │
│  Processors  │◄──────│    - quote-expiration-check (every 15m)       │
│  (workers)   │ dequeue│    - quote-payment-expiration (every 15m)    │
│              │       │    - payment-reconciliation (every 5m)         │
│              │       │    - low-stock-check (every 1h)                │
└──────────────┘       └───────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │                    │
              Local (dev)          Production
              redis:6379         Upstash (TLS)
              (docker-compose)   UPSTASH_REDIS_URL
```

## Redis connection strategy

```typescript
// Environment-aware factory
function createRedisConnection(): IORedis {
  const url = process.env.UPSTASH_REDIS_URL;
  if (url) {
    // Production: Upstash with TLS
    return new IORedis(url, {
      maxRetriesPerRequest: null, // required by BullMQ
      tls: url.startsWith('rediss://') ? {} : undefined,
    });
  }
  // Local: docker-compose Redis
  return new IORedis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    maxRetriesPerRequest: null,
  });
}
```

## Queue definitions

| Queue             | Purpose                  | Concurrency | Retry                   | Repeatable |
| ----------------- | ------------------------ | ----------- | ----------------------- | ---------- |
| `scheduled-jobs`  | All periodic/cron jobs   | 1           | 2 attempts              | Yes        |
| `payment-webhook` | Async webhook processing | 3           | 3 attempts, exp backoff | No         |
| `email-send`      | Transactional emails     | 2           | 3 attempts, exp backoff | No         |

## Job types (discriminated by `name` field in queue)

### `scheduled-jobs` queue

- `quote-expiration-check` — repeat every 15 min
- `quote-payment-expiration-check` — repeat every 15 min
- `payment-reconciliation` — repeat every 5 min
- `low-stock-check` — repeat every 1 hour

### `payment-webhook` queue

- `process-payment-result` — payload: `{ referenceId, paymentServiceRef, status }`

### `email-send` queue

- `send-email` — payload: `{ to, subject, templateId, variables }`

## Retry policy

```typescript
const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000, // 1s, 4s, 16s
  },
  removeOnComplete: { age: 24 * 3600 }, // keep completed for 24h
  removeOnFail: false, // keep failed for inspection
};
```

## Module structure

```
apps/api-core/src/infrastructure/queue/
├── queue.module.ts              # NestJS module registering BullMQ
├── queue-config.factory.ts      # Redis connection factory (env-aware)
├── processors/
│   ├── scheduled-jobs.processor.ts   # Handles all repeatable jobs
│   ├── payment-webhook.processor.ts  # Handles webhook processing
│   └── email-send.processor.ts       # Handles email dispatch
└── queue.constants.ts           # Queue names, job names constants
```

## Migration plan (from setInterval)

1. Remove `setInterval` from `PaymentReconciliationJob.onModuleInit()`
2. Remove manual scheduling from `QuoteExpirationJob`
3. Remove manual scheduling from `LowStockCheckJob`
4. Register all as repeatable jobs in `queue.module.ts` on app bootstrap
5. Existing job logic (the actual `execute()` methods) stays unchanged — only the scheduling mechanism changes

## Docker Compose (dev)

Redis service already expected in `infra/docker/docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - '6379:6379'
  volumes:
    - redis-data:/data
```

## Graceful shutdown

```typescript
// In main.ts
app.enableShutdownHooks();

// BullMQ workers close gracefully by default when NestJS shutdown hooks fire
```

## Cross-feature dependencies

- Depends on: `feature-scaffold-monorepo` (status: merged) — docker-compose, project structure
- Depends on: `feature-direct-purchase` (status: merged) — payment reconciliation job
- Depends on: `feature-custom-quote` (status: merged) — quote expiration jobs
- Depends on: `feature-supply-stock-management` (status: merged) — low stock check job
- No unmerged dependencies.
