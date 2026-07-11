# Specs: Infrastructure and deployment

## Functional requirements

- FR1. `docker-compose` that starts: `api-core` (NestJS), `payment-service` (Spring Boot), `landing` and `admin-dashboard` (served by Nginx after build), Redis (or pointing to Upstash), and connection to Supabase Postgres.
- FR2. Nginx serves React `dist/` statics in production and acts as reverse proxy to `api-core` and `payment-service` under routes `/api/*` and `/payments/*` respectively (same domain, no CORS issues in prod).
- FR3. Sensitive variables only via `.env` (never committed): Supabase credentials, Upstash, PayPal (client id/secret sandbox and prod), JWT secrets, SMTP/email provider.
- FR4. Database seed script with **fake data** (mock) for development/testing: prototypes, supplies, orders, quotes, and complaints in various states.

## Non-functional requirements

- Clear environment separation: `development`, `staging`, `production` (files `.env.development`, `.env.staging`, `.env.production`, none committed except `.env.example`).
- Turborepo caches builds for `apps/*` and `services/api-core` — the CI pipeline must leverage that cache.

## Edge cases

- `payment-service` (Java) does not participate in the Turborepo graph — its build is an independent Docker step (Maven), documented separately to avoid breaking expectations of those only familiar with the JS/TS world.

## Acceptance criteria

- `docker compose up` from scratch, with a complete `.env`, leaves the system functional end-to-end in a clean environment (includes test data via seed).
