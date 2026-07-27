# Environment variables

None of these are committed. `.env.example` in the root documents the keys without real values.

## Immutable rule

Once `.env` is created and populated with real keys, it **cannot** be modified, edited, or deleted. Any change to environment variables must follow this process:

1. Document the change in this file first.
2. Update `.env.example` if the variable is new.
3. Manually apply the change to `.env` on each developer machine.
4. Never commit `.env` to version control.

## Database and cache

| Variable               | Description                                           |
| ---------------------- | ----------------------------------------------------- |
| `DATABASE_URL`         | Supabase Postgres connection string (api-core domain) |
| `PAYMENT_DATABASE_URL` | Connection string for payment-service own schema      |

## Redis

Two separate Redis concerns with different requirements:

### Upstash REST — Cache & Rate Limiting (HTTP, serverless-friendly)

| Variable                   | Description                                           |
| -------------------------- | ----------------------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | Upstash REST endpoint (e.g. `https://xxx.upstash.io`) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST auth token                               |

Used by `RedisModule` for cache reads/writes and rate limiting. Works over HTTP — no persistent connection needed.

### Local Redis — BullMQ Queues (TCP, persistent connection required)

| Variable         | Description                                                                       |
| ---------------- | --------------------------------------------------------------------------------- |
| `BULL_REDIS_URL` | Optional explicit URL (e.g. `redis://localhost:6379`). Overrides REDIS_HOST/PORT. |
| `REDIS_HOST`     | Redis hostname for BullMQ. Default: `localhost`. Docker Compose: `modulapp-redis` |
| `REDIS_PORT`     | Redis port for BullMQ. Default: `6379`                                            |

**Why local Redis?** BullMQ needs persistent TCP connections with subscriber channels. Upstash closes idle TCP connections (serverless model) which crashes Bull. Use a local Redis for queues:

```bash
# Start local Redis for BullMQ (one-time)
docker run -d --name redis-local -p 6379:6379 redis:7-alpine
```

## Auth

| Variable                    | Description                                   |
| --------------------------- | --------------------------------------------- |
| `JWT_ACCESS_SECRET`         | Admin access token signature (short-lived)    |
| `JWT_REFRESH_SECRET`        | Refresh token signature                       |
| `QUOTE_ACTION_TOKEN_SECRET` | Signature for quote accept/reject magic links |

## PayPal (payment-service)

| Variable                                    | Description                                    |
| ------------------------------------------- | ---------------------------------------------- |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Sandbox or live credentials                    |
| `PAYPAL_MODE`                               | `sandbox` \| `live`                            |
| `PAYPAL_WEBHOOK_ID`                         | To validate incoming PayPal webhook signatures |

## Email (Mailjet)

| Variable             | Description                                        |
| -------------------- | -------------------------------------------------- |
| `MAILJET_API_KEY`    | Mailjet API key                                    |
| `MAILJET_API_SECRET` | Mailjet API secret                                 |
| `MAILJET_FROM_EMAIL` | Sender email address (must be verified in Mailjet) |
| `MAILJET_FROM_NAME`  | Sender display name                                |

## Storage (receipts)

| Variable                    | Description                                  |
| --------------------------- | -------------------------------------------- |
| `SUPABASE_URL`              | Project URL (e.g. https://abc.supabase.co)   |
| `SUPABASE_STORAGE_BUCKET`   | Bucket where files are stored (images, PDFs) |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend only, never exposed to frontend      |

## Internal Webhooks (api-core ↔ payment-service)

| Variable                | Description                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- |
| `WEBHOOK_SHARED_SECRET` | HMAC-SHA256 shared secret for payment-service → api-core webhook authentication. Must match on both services.   |
| `CORS_ORIGINS`          | Comma-separated list of allowed CORS origins (defaults to `http://localhost:3000,http://localhost:3001` in dev) |
