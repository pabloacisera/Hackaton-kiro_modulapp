# ModulApp — Modular Furniture & Events Platform

A platform for selling modular MDF furniture and event arches, with two business flows:

- **Flow A — Direct purchase**: customer picks a priced prototype, pays, admin accepts/rejects.
- **Flow B — Custom quote**: customer submits a request, admin quotes, customer pays within a time window.

## Prerequisites

| Tool                    | Version                       |
| ----------------------- | ----------------------------- |
| Node.js                 | 20+                           |
| pnpm                    | 9+                            |
| Java                    | 17+                           |
| Docker + Docker Compose | latest                        |
| Maven                   | 3.9+ (or use `./mvnw`)        |
| Terraform               | 1.5+ (production deploy only) |

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd Hackaton-kiro_modulapp

# 2. Set up environment variables
cp .env.example .env
# Fill in .env — see .kiro/steerings/09-environment-variables.md

# 3. Start everything
bash scripts/dev-up.sh
```

Open in browser:

- Landing → http://localhost:3000
- Admin Dashboard → http://localhost:3001
- API health → http://localhost:8080/health
- Payment service health → http://localhost:8081/health

## Architecture

```
Hackaton-kiro_modulapp/
├── apps/
│   ├── landing/           React + Vite — public storefront (port 3000)
│   ├── admin-dashboard/   React + Vite — internal admin panel (port 3001)
│   ├── api-core/          NestJS — backend domain service (port 8080)
│   └── payment-service/   Spring Boot — financial microservice (port 8081)
├── packages/
│   └── shared-types/      TypeScript DTOs shared across JS/TS apps
├── infra/
│   ├── docker/            docker-compose.yml
│   └── nginx/             nginx.conf — reverse proxy
└── scripts/
    ├── dev-up.sh          Start full stack
    └── seed-db.sh         Seed database
```

| Layer          | Technology                                                  |
| -------------- | ----------------------------------------------------------- |
| Monorepo       | Turborepo + pnpm workspaces                                 |
| Frontend       | React + Vite + Tailwind CSS (MVC pattern)                   |
| Backend        | NestJS + Prisma + TypeScript (Clean Architecture)           |
| Payments       | Spring Boot 3 + Java 17 (isolated microservice)             |
| Database       | PostgreSQL via AWS RDS (IAM auth)                           |
| Cache / Queues | Redis via Upstash + BullMQ                                  |
| Email          | Mailjet                                                     |
| Realtime       | SSE (catalog → landing), WebSockets (notifications → admin) |

## Development Commands

Run from repo root:

```bash
pnpm dev          # Start all JS/TS workspaces in watch mode
pnpm build        # Build all workspaces
pnpm lint         # Lint all workspaces
pnpm test         # Run all tests
pnpm format       # Format all files with Prettier
```

Payment service (Java — run separately):

```bash
cd apps/payment-service
mvn spring-boot:run
```

## Documentation

| Document                                                                                   | Description                           |
| ------------------------------------------------------------------------------------------ | ------------------------------------- |
| [docs/roadmap.md](docs/roadmap.md)                                                         | Feature phases and dependency order   |
| [docs/feature-status.md](docs/feature-status.md)                                           | Current implementation status         |
| [docs/sprint-plan.md](docs/sprint-plan.md)                                                 | Day-by-day task plan                  |
| [docs/commit-conventions.md](docs/commit-conventions.md)                                   | Commit message format                 |
| [docs/ci-cd.md](docs/ci-cd.md)                                                             | CI/CD pipeline documentation          |
| [docs/terraform-guide.md](docs/terraform-guide.md)                                         | Terraform step-by-step for developers |
| [docs/deployment.md](docs/deployment.md)                                                   | Full production deployment guide      |
| [.kiro/steerings/00-project-context.md](.kiro/steerings/00-project-context.md)             | Full project context for agents       |
| [.kiro/steerings/06-team-workflow.md](.kiro/steerings/06-team-workflow.md)                 | Team roles and PR process             |
| [.kiro/steerings/09-environment-variables.md](.kiro/steerings/09-environment-variables.md) | All environment variables documented  |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch conventions, PR process, and code review rules.
