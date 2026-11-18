# Deployment Guide

> Complete guide for deploying ModulaApp to production on **Render (free tier)**,
> with **Neon** for PostgreSQL and **Upstash** for Redis.
>
> The previous AWS/Terraform path (EC2 + RDS + Cloudflare Tunnel) is **no longer used**
> — the AWS account was lost. `infra/terraform/` is kept as historical reference only;
> see [terraform-guide.md](terraform-guide.md) (marked legacy).

## Deployment Architecture

ModulaApp runs as **three Render web services** (Docker builds). A single front-door
service serves the static frontends and reverse-proxies to the other services' **public**
URLs (Render free web services cannot receive private-network traffic).

| Component                     | Where it runs                                |
| ----------------------------- | -------------------------------------------- |
| Landing (React)               | `modula-web` — nginx serves static           |
| Admin Dashboard (React)       | `modula-web` — nginx serves static           |
| API Core (NestJS)             | `modula-api` — Docker container              |
| Payment Service (Spring Boot) | `modula-payment` — Docker container          |
| Nginx (reverse proxy)         | `modula-web` — front-door                    |
| PostgreSQL                    | **Neon** (2 databases, external)             |
| Redis                         | **Upstash** (REST cache + TCP for BullMQ)    |
| HTTPS / DNS                   | **Cloudflare** (DNS-only CNAME)              |
| Email                         | Mailjet (external)                           |
| Payments                      | PayPal API (external)                        |
| Storage                       | Supabase Storage (external)                  |

### Services

| Service          | Dockerfile                        | Context              | Health    | Public URL                            |
| ---------------- | --------------------------------- | -------------------- | --------- | ------------------------------------- |
| `modula-api`     | `apps/api-core/Dockerfile`        | `.` (repo root)      | `/health` | `https://modula-api.onrender.com`     |
| `modula-payment` | `apps/payment-service/Dockerfile` | `apps/payment-service` | `/health` | `https://modula-payment.onrender.com` |
| `modula-web`     | `infra/render/Dockerfile.web`     | `.` (repo root)      | `/`       | `https://modula-web-x8xk.onrender.com` |

> `modula-web` runs `envsubst` at start with `$PORT`, `$API_CORE_URL`, `$PAYMENT_URL`.
> Render injects `$PORT`; services must bind `0.0.0.0:$PORT`.

## Prerequisites

Before deploying, you need:

1. **Render** account + API key (Account Settings → API Keys).
2. **Neon** project with 2 Postgres databases (api-core, payment-service).
3. **Upstash** Redis: REST endpoint (cache/rate-limit) **and** TCP `rediss://` URL (BullMQ).
4. **Supabase** project + public bucket (images, PDFs).
5. **PayPal** app (sandbox/live) with a webhook.
6. **Mailjet** account + verified sender.
7. **Cloudflare** DNS access for the domain.
8. **Complete env vars** (see [DEPLOY.md](../DEPLOY.md) §3 and
   [`.kiro/steerings/09-environment-variables.md`](../.kiro/steerings/09-environment-variables.md)).

## Deployment Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ Developer pushes to main                                             │
│                                                                     │
│  GitHub Actions: lint → test → build  ──(green)──►  deploy job      │
│                                                       │             │
│                                                       ▼             │
│                          POST /services/{id}/deploys (×3 Render)    │
│                                                       │             │
│                                                       ▼             │
│  modula-api / modula-payment / modula-web rebuild & restart         │
└─────────────────────────────────────────────────────────────────────┘
```

## Step-by-Step First Deployment

### 1. Create the three services on Render

- Type: **Web Service**, plan **free**, region **oregon**, branch **main**.
- Build: **Dockerfile** (paths per the table above).
- Health check path per the table above.
- Set **`autoDeploy: no`** (deploys are CI-gated — see step 3).

### 2. Set environment variables per service

See [DEPLOY.md](../DEPLOY.md) §6.1. Key production values:

- `APP_PUBLIC_URL=https://modulapp.artisandevs.site`
- `CORS_ORIGINS=https://modulapp.artisandevs.site`
- `PAYMENT_SERVICE_URL=https://modula-payment.onrender.com` (on `modula-api`)
- `API_CORE_WEBHOOK_URL=https://modula-api.onrender.com` (on `modula-payment`)
- `BULL_REDIS_URL=rediss://...` (TCP, for BullMQ)
- `NODE_ENV=production` / `SPRING_PROFILES_ACTIVE=production`

### 3. Wire CI-gated deploys

Add the `RENDER_API_KEY` secret to the GitHub repo. The `deploy` job in
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) triggers the three deploys
**only** after `lint-test-build` passes on a push to `main`.

### 4. Custom domain + DNS

- Add `modulapp.artisandevs.site` as a custom domain on `modula-web`.
- Cloudflare DNS: **CNAME `modulapp` → `modula-web-x8xk.onrender.com`, DNS-only**.

### 5. Migrations and seed

- `modula-api` runs `prisma migrate deploy` on start; `modula-payment` runs Flyway.
- Optional demo data: run the seed one-off container with `NODE_ENV=development`
  (see [DEPLOY.md](../DEPLOY.md) §9).

### 6. Verify

```bash
curl -fsS https://modulapp.artisandevs.site/health         # {"status":"ok"}
curl -s -o /dev/null -w "%{http_code}\n" https://modulapp.artisandevs.site/admin/   # 200
curl -fsS https://modulapp.artisandevs.site/api/catalog/prototypes | head
```

## Updating the Application

Push to `main`. If CI is green, the `deploy` job redeploys all three services. No manual
steps. To force a deploy manually, use the Render API (see [DEPLOY.md](../DEPLOY.md) §11).

## Environment Separation

| Environment | Infrastructure                  | Database         | Redis        | Domain        |
| ----------- | ------------------------------- | ---------------- | ------------ | ------------- |
| Development | Local (docker-compose.yml)      | Local or Neon dev | Upstash dev  | localhost     |
| Production  | Render (3 web services)         | Neon prod        | Upstash prod | modulapp.artisandevs.site |

## Monitoring & Logs

Logs are per-service in the Render dashboard, or via the Render API:

```bash
curl "https://api.render.com/v1/logs?ownerId=OWNER_ID&resource=SERVICE_ID&limit=50" \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

### Health Checks

- `GET /health` (front-door) → proxied to `modula-api` health.
- `GET /payments/health` (front-door) → proxied to `modula-payment` health.

### Cold starts on the free tier

All three services use the Render **Free** plan. Each one sleeps after ~15 minutes
without inbound traffic and takes about a minute to wake on the next request. A
health-check path does not keep a service awake: Render only probes instances that
are already running. During a cold start, `/api/catalog/prototypes` can return `502`
and the landing page may render an empty catalog; the first payment call can
likewise time out. These are transient startup delays, not data loss.

## Disaster Recovery

### Rollback a bad deploy

```bash
# Redeploy a known-good commit on a service:
curl -X POST "https://api.render.com/v1/services/SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json" \
  -d '{"commitId":"<good-sha>"}'
```

Data lives in Neon (external), so it survives service redeploys.

### Service replacement

Services are stateless containers — Render can rebuild them from the Dockerfiles at any
time. No instance is persistent; all state is in Neon/Upstash/Supabase.

## Security Checklist

- [ ] `.env` never committed to git
- [ ] All secrets set as Render env vars (not in the repo)
- [ ] `NODE_ENV=production` / `SPRING_PROFILES_ACTIVE=production` (no dev fallbacks)
- [ ] `PAYPAL_MODE=live` only when ready for real transactions
- [ ] Cloudflare WAF rules active
- [ ] Production branch protection enabled on GitHub
- [ ] `RENDER_API_KEY` stored as a GitHub Actions secret
