# ModulApp

**E-commerce platform for modular MDF furniture and event arches**, built with a microservices architecture. Supports two purchase flows: direct buy with PayPal checkout, and custom quote requests with admin approval workflow.

Built during the Kiro Hackathon 2026 as a full-stack production-ready application.

---

## Key Features

### Customer-Facing (Landing)

- **Product catalog** with real-time price/stock updates via Server-Sent Events (SSE)
- **Direct purchase flow** — select a prototype, pay with PayPal, receive confirmation
- **Custom quote requests** — describe what you need, receive a quote within 48h, pay to confirm
- **Bilingual support** — Spanish and English (i18n)
- **No accounts required** — customers identified by email + signed tokens

### Admin Dashboard

- **Full catalog CRUD** — create, edit, deactivate prototypes with image upload to Supabase Storage
- **Order management** — accept/reject orders with automatic stock adjustment and PayPal refunds
- **Quote lifecycle** — review requests, present quotes with PDF generation, track acceptance/payment
- **Supply & stock management** — track raw materials, low-stock alerts via background jobs
- **Complaint handling** — review, approve refunds, or resolve without refund
- **Delivery scheduling** — unified view of all pending deliveries (orders + quotes)
- **Real-time notifications** — WebSocket push for new orders, quotes, complaints, stock alerts
- **Excel import/export** — bulk catalog management via CSV
- **Search & pagination** — all tables have debounced search and paginated navigation

### Platform

- **Automatic PayPal refunds** on order rejection
- **Quote expiration** — 48h to respond, 24h to pay (automated via BullMQ jobs)
- **Reconciliation jobs** — recover from missed PayPal webhooks
- **PDF quote generation** — professional documents uploaded to cloud storage
- **Structured logging** — JSON logs with request correlation (Pino)
- **Rate limiting** — login protection (5 attempts per 15 minutes)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Nginx (reverse proxy)                     │
└──────┬──────────────────────┬────────────────────────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐    ┌───────────────────┐
│   Landing    │    │  Admin Dashboard   │
│   (React)    │    │     (React)        │
│   Port 3000  │    │     Port 3001      │
└──────┬───────┘    └────────┬──────────┘
       │ SSE                 │ WebSocket
       ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    api-core (NestJS)                           │
│         Clean Architecture · BullMQ Jobs · Prisma ORM         │
│                        Port 8080                              │
└──────┬──────────────────────────────────┬────────────────────┘
       │ HTTP                             │ Prisma
       ▼                                  ▼
┌──────────────────┐              ┌──────────────┐
│ payment-service  │              │  PostgreSQL   │
│ (Spring Boot)    │              │  (Supabase)   │
│    Port 8081     │              └──────────────┘
│ PayPal + Refunds │
└──────────────────┘              ┌──────────────┐
                                  │    Redis      │
                                  │  (Upstash)    │
                                  └──────────────┘
```

### Inter-Service Communication

| From → To                  | Protocol       | Purpose                                     |
| -------------------------- | -------------- | ------------------------------------------- |
| api-core → payment-service | HTTP           | Initiate payments and refunds               |
| payment-service → api-core | Webhook (HTTP) | Confirm payment/refund results              |
| api-core → landing         | SSE            | Broadcast catalog changes in real-time      |
| api-core → admin-dashboard | WebSocket      | Push notifications to admin                 |
| api-core → Redis           | BullMQ         | Scheduled jobs (expiration, alerts, emails) |

---

## Tech Stack

| Layer          | Technology                      | Purpose                                    |
| -------------- | ------------------------------- | ------------------------------------------ |
| Monorepo       | Turborepo + pnpm workspaces     | Build orchestration, dependency management |
| Frontend       | React 18 + Vite + Tailwind CSS  | SPA with MVC pattern                       |
| Backend        | NestJS + TypeScript             | Clean Architecture, domain-driven          |
| Payments       | Spring Boot 3 + Java 17         | Isolated financial microservice            |
| ORM            | Prisma                          | Type-safe database access                  |
| Database       | PostgreSQL (Supabase)           | Primary data store                         |
| Cache          | Redis (Upstash REST)            | Response caching, rate limiting            |
| Queues         | Redis + BullMQ                  | Background job processing                  |
| Payments       | PayPal Orders API + Refunds API | Payment processing                         |
| Email          | Mailjet                         | Transactional emails                       |
| Storage        | Supabase Storage                | Product images, PDF receipts               |
| PDF            | pdfkit                          | Quote document generation                  |
| Realtime       | SSE + Socket.IO                 | Live updates for catalog and notifications |
| i18n           | react-i18next                   | Multilingual support (es/en)               |
| Infrastructure | Docker + Nginx                  | Containerized deployment                   |
| CI/CD          | GitHub Actions                  | Lint, test, build on every push            |
| IaC            | Terraform                       | AWS infrastructure provisioning            |

---

## Prerequisites

| Tool                    | Version                   |
| ----------------------- | ------------------------- |
| Node.js                 | 20+                       |
| pnpm                    | 9+                        |
| Java                    | 17+ (for payment-service) |
| Docker + Docker Compose | Latest                    |
| Maven                   | 3.9+ (or use `./mvnw`)    |

---

## Quick Start (Local Development)

```bash
# 1. Clone
git clone https://github.com/pabloacisera/Hackaton-kiro_modulapp.git
cd Hackaton-kiro_modulapp

# 2. Environment setup
cp .env.example .env
# Fill in required values — see docs below

# 3. Install dependencies
pnpm install

# 4. Start all services (Docker Compose + local dev servers)
bash scripts/dev-up.sh
```

### Access Points

| Service                  | URL                          |
| ------------------------ | ---------------------------- |
| Landing (storefront)     | http://localhost:3000        |
| Admin Dashboard          | http://localhost:3001        |
| API Core (health)        | http://localhost:8080/health |
| Payment Service (health) | http://localhost:8081/health |

### Alternative: Docker-only (no local Node/Java)

```bash
cd infra/docker
docker compose up --build
```

Access via Nginx reverse proxy at http://localhost:80.

---

## Development Commands

```bash
# From repo root
pnpm dev           # Start all JS/TS workspaces in watch mode
pnpm build         # Build all workspaces
pnpm lint          # Lint all workspaces (ESLint)
pnpm test          # Run all test suites
pnpm format        # Format with Prettier

# Payment service (Java — run separately)
cd apps/payment-service
mvn spring-boot:run

# Database
cd apps/api-core
npx prisma generate   # Generate Prisma client
npx prisma migrate deploy  # Apply migrations
```

---

## Project Structure

```
├── apps/
│   ├── landing/             React — public storefront
│   ├── admin-dashboard/     React — internal admin panel
│   ├── api-core/            NestJS — backend domain service
│   └── payment-service/     Spring Boot — financial microservice
├── packages/
│   └── shared-types/        TypeScript DTOs shared across apps
├── infra/
│   ├── docker/              Docker Compose configs (dev + prod)
│   ├── nginx/               Reverse proxy configuration
│   └── terraform/           AWS infrastructure as code
├── scripts/                 Automation scripts
├── sql/                     Database schemas and migrations
├── docs/                    Developer documentation
├── flows/                   Feature specifications and flows
└── .kiro/                   AI agent configuration and specs
```

---

## Environment Variables

See [`.kiro/steerings/09-environment-variables.md`](.kiro/steerings/09-environment-variables.md) for the complete reference.

Key groups:

- **Database** — Supabase PostgreSQL connection
- **Redis** — Upstash REST (cache) + local Redis (BullMQ queues)
- **Auth** — JWT secrets for admin tokens and quote action tokens
- **PayPal** — Client credentials and webhook configuration
- **Email** — Mailjet API keys
- **Storage** — Supabase Storage bucket for images and PDFs

---

## Testing

```bash
# All tests
pnpm test

# Specific workspace
cd apps/api-core && npx jest
cd apps/admin-dashboard && npx vitest run
cd apps/landing && npx vitest run
```

**Test coverage:**

- api-core: 217 tests (unit + integration)
- admin-dashboard: 114 tests (components + controllers)
- landing: 69 tests (views + controllers)

---

## CI/CD

GitHub Actions runs on every push to `main` and on PRs:

1. **Lint** — ESLint across all workspaces
2. **Test** — Full test suite (Jest + Vitest)
3. **Build** — TypeScript compilation + Vite production builds

---

## Deployment

### Docker Compose (Production)

```bash
bash scripts/prod-up.sh
```

Uses `infra/docker/docker-compose.prod.yml` with:

- Nginx reverse proxy (port 80)
- All services as containers
- Health checks with restart policies
- Cloudflare Tunnel for HTTPS termination

### AWS (Terraform)

See [`docs/terraform-guide.md`](docs/terraform-guide.md) and [`docs/deployment.md`](docs/deployment.md) for the full production deployment guide with:

- EC2 instance
- RDS PostgreSQL with IAM authentication
- Security groups and networking
- Automated provisioning

---

## Documentation

| Document                                                 | Description                                 |
| -------------------------------------------------------- | ------------------------------------------- |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)               | Architecture entry point                    |
| [CONTRIBUTING.md](CONTRIBUTING.md)                       | Branch conventions, PR process, code review |
| [docs/roadmap.md](docs/roadmap.md)                       | Feature phases and implementation order     |
| [docs/feature-status.md](docs/feature-status.md)         | Current status of all features              |
| [docs/sprint-plan.md](docs/sprint-plan.md)               | Day-by-day execution plan                   |
| [docs/deployment.md](docs/deployment.md)                 | Production deployment guide                 |
| [docs/terraform-guide.md](docs/terraform-guide.md)       | Infrastructure as Code walkthrough          |
| [docs/commit-conventions.md](docs/commit-conventions.md) | Commit message standards                    |

---

## Team

Built by the ModulApp team during the Kiro Hackathon 2026.

See [docs/team.md](docs/team.md) for the full team directory.

---

## License

All rights reserved. This project was created for the Kiro Hackathon 2026.
