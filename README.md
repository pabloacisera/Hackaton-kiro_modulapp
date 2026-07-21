# Modular Furniture (MDF) & Event Arches — Management and Budget System

A platform for selling modular furniture (MDF) and arches for events, with two
business flows that converge at the same checkout but behave differently:

- **Flow A — Direct Purchase**: customer chooses a manufactured prototype,
  pays, admin accepts or rejects the order.
- **Flow B — Custom Quote**: customer describes needs, admin quotes,
  customer accepts/rejects via email, pays within a time window if accepted.

## Quick start

1. Read `.kiro/steerings/00-project-context.md` — business decisions and
   non-negotiable architecture.
2. Copy `.env.example` to `.env` and complete (see `.kiro/steerings/09-environment-variables.md`).
3. `bash scripts/dev-up.sh` — starts everything with Docker Compose.
4. `bash scripts/seed-db.sh` — seeds the database with test data.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, MVC architecture, Tailwind CSS, FontAwesome |
| Backend domain | NestJS + TypeScript, Clean Architecture, Prisma |
| Financial microservice | Java + Spring Boot (PayPal, receipts) |
| Database | PostgreSQL (Supabase) |
| Cache/Queues | Redis (Upstash) + BullMQ |
| Payments | PayPal (Orders API, Refunds API) |
| Email | Mailjet (transactional) |
| Realtime | SSE (landing) + WebSockets (admin) |
| Infrastructure | Docker + Docker Compose, Nginx |
| Monorepo | Turborepo |

## Repository structure

```
.kiro/            Agent rules and feature specs
docs/            Documentation for human developers
scripts/         Automation (bash)
apps/            Landing, admin dashboard, api-core, payment-service
infra/           Docker and Nginx
packages/        Shared types/DTOs (Turborepo)
```

## Documentation

- **Project overview** (architecture, tech stack, agent rules, doc map): [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md)
- **Business and architecture**: `.kiro/steerings/` (all in English)
- **Team workflow**: `.kiro/steerings/06-team-workflow.md`
- **Feature specs**: `.kiro/specs/<feature>/{specs,design,tasks}.md`
- **Roadmap and open questions**: `docs/roadmap.md`
- **Team directory**: `docs/team.md`
- **Java guide for beginners**: `docs/java-springboot-guide.md`
- **Environment variables**: `.kiro/steerings/09-environment-variables.md`
- **UI admin conventions**: `.kiro/steerings/08-admin-ui-conventions.md`
- **Architecture conventions**: `.kiro/steerings/05-architecture-conventions.md`
- **Code review**: `.kiro/steerings/03-code-review.md`

## Development workflow

For the complete workflow explanation, see `.kiro/steerings/06-team-workflow.md`.

### Features
Each feature lives in `.kiro/specs/<feature>/` with three files:
- `specs.md` — What and why
- `design.md` — How
- `tasks.md` — Microtask breakdown

### Branches
- Features: `<number>-feature-<feature-name>`
- Issue fixes: `<number>-fix-issue-<id>-<slug>`
- Small fixes: commit directly to main

### Code review
- Owner asks agent: "Review PR #N"
- Agent creates branch, pulls changes, runs tests, gives report
- Owner reads report and decides
- **Only owner can merge**

### Triple layer of protection
1. Developer runs tests locally (before PR)
2. GitHub Actions runs CI (on PR creation)
3. Agent reviews on owner's request (before merge)

### Testing
- Unit tests: Jest (backend), Vitest (frontend)
- Integration tests: Jest + Supertest
- E2E tests: Playwright
- Manual tests: curl, Postman, browser (documented in PR)
- CI runs on every PR and push to main

## License

Private — All rights reserved.
