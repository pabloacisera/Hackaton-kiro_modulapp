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
| `UPSTASH_REDIS_URL`    | Redis for catalog cache, BullMQ, and rate limiting    |

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
