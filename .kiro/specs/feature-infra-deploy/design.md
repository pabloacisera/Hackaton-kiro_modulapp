# Design: Infrastructure and deployment

## docker-compose (services)

```yaml
services:
  nginx:            # reverse proxy + React statics
  api-core:         # NestJS (multi-stage build)
  payment-service:  # Spring Boot (multi-stage build with Maven)
  redis:            # for local development only; in staging/prod point to Upstash via env
```

Postgres **does not** start in compose — always points to Supabase (dev, staging, and prod have separate Supabase projects).

## Nginx

- `location /api/ { proxy_pass http://api-core:3000; }`
- `location /payments/ { proxy_pass http://payment-service:8081; }`
- `location / { root /usr/share/nginx/html; try_files $uri /index.html; }`
  (serves `landing` build; `admin-dashboard` on subdomain or separate subpath with its own `server {}` block).

## Environment variables (summary, full details in `.kiro/steerings/09-environment-variables.md`)

```
DATABASE_URL=              # Supabase Postgres
UPSTASH_REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox|live
SMTP_HOST= / SMTP_USER= / SMTP_PASS=   (or email provider API key)
```

## Fake data seed

Script (`scripts/seed-db.sh` → runs a TS seeder with `faker`) that creates: active/inactive prototypes with varying stock, supplies some intentionally below minimum (to see the alarm working), orders in each state machine state, quotes in each state, and a couple of complaints.

## CI/CD (high level, details in `docs/ci-cd.md`)

Pipeline: lint → test → build (with Turborepo cache) → Docker image build → push to registry → deploy. `payment-service` has its own Maven build job parallel to the Turborepo pipeline.
