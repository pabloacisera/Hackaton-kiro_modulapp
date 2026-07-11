# Project Overview

Entry point for new developers and coding agents joining this project.

## What the system is

A platform for selling modular furniture (MDF) and arches for events. Two
business flows converge at the same checkout but behave differently:

- **Flow A — Direct Purchase**: the customer chooses a manufactured prototype,
  pays via PayPal, and the admin accepts or rejects the order. Stock is deducted
  only on acceptance; rejection triggers an automatic refund.
- **Flow B — Custom Quote**: the customer describes what they need, the admin
  quotes (48h to respond), the customer accepts/rejects via email. If accepted,
  the customer has 24 hours to pay. Expiration is automatic but archival is
  manual.

Customers have no accounts — identity is resolved via email + signed tokens
(magic links). All payments go through PayPal. Currency is USD only.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       Nginx                             │
│                  (reverse proxy)                        │
└──────┬──────────────────────┬───────────────────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐    ┌──────────────────┐
│   landing    │    │  admin-dashboard  │
│   (React)    │    │     (React)       │
└──────┬───────┘    └────────┬─────────┘
       │ SSE                 │ WebSockets
       ▼                     ▼
┌──────────────────────────────────────────────────────────┐
│                    api-core (NestJS)                      │
│  Clean Architecture: domain → application → infra → http  │
│  BullMQ jobs (quote expiration, stock alerts, emails)    │
└──────┬──────────────────────────────┬────────────────────┘
       │ HTTP                         │ Prisma
       ▼                              ▼
┌──────────────────┐          ┌──────────────┐
│ payment-service  │          │  PostgreSQL   │
│ (Java/Spring Boot)│          │  (Supabase)   │
│ PayPal + receipts │          └──────────────┘
└──────────────────┘                    ┌──────────────┐
                                        │    Redis      │
                                        │  (Upstash)    │
                                        └──────────────┘
```

### Inter-service communication

| From | To | Mechanism | Purpose |
|---|---|---|---|
| api-core | payment-service | HTTP | Initiate payment/refund |
| payment-service | api-core | Webhook | Confirm payment/refund result |
| api-core | landing | SSE | Broadcast catalog price/stock changes |
| api-core | admin-dashboard | WebSockets | Targeted notifications, alarms |
| api-core | Redis | BullMQ | Scheduled jobs (expiration, reminders, alerts) |

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

## Agent rules summary

These are the non-negotiable rules for any coding agent (Kiro, Claude,
Copilot, etc.). Full details in `.kiro/steerings/00-project-context.md`.

1. **Never assume business logic** — always ask the owner.
2. **Never commit directly to `main`** without owner confirmation.
3. **Never merge or approve PRs** — only the owner merges.
4. **Max half a day per microtask**, max 2-3 files — decompose if larger.
5. **Financial code review** — changes to `payment-service/` or financial
   entities require two approvers, one human.
6. **Immutable `.env`** — once populated, cannot be modified without
   documentation and owner approval.
7. **English only** — all docs, code, commits, and directory names.
8. **Report upstream changes** before continuing, whenever it syncs a
   collaborator's branch against `upstream/main`.

## Documentation map

### For agents (`.kiro/`)

| File | What it covers |
|---|---|
| `steerings/00-project-context.md` | Business decisions, architecture, authorization points |
| `steerings/01-feature-flow.md` | Feature lifecycle, microtask format, branch naming |
| `steerings/02-issues-y-bugs.md` | Issue registration and fix planning |
| `steerings/03-code-review.md` | Code review checklist (financial reinforced section) |
| `steerings/04-pull-requests.md` | PR format and merge requirements |
| `steerings/05-architecture-conventions.md` | MVC frontend, Clean Architecture backend, testing |
| `steerings/06-team-workflow.md` | Roles, three-layer protection, agent limitations |
| `steerings/07-supply-data-model.md` | Supply/stock data model |
| `steerings/08-admin-ui-conventions.md` | Admin dashboard UI patterns |
| `steerings/09-environment-variables.md` | Env var documentation and immutability rule |
| `specs/<feature>/` | Per-feature specs, design docs, and task breakdowns |

### For humans (`docs/`)

| File | What it covers |
|---|---|
| `roadmap.md` | Implementation order and open questions |
| `team.md` | Team directory and reviewer assignments |
| `feature-status.md` | Current task counts per feature |
| `commit-conventions.md` | Commit message format and atomicity rules |
| `collaboration-log.md` | Collaboration activity log |
| `java-springboot-guide.md` | Java/Spring Boot guide for TypeScript devs |

### Repo root

| File | What it covers |
|---|---|
| `README.md` | Quick start, tech stack, development workflow |
| `CONTRIBUTING.md` | Forking, PRs, agent limits, financial review |
| `PROJECT_OVERVIEW.md` | This file — the entry point |

## Repository structure

```
.kiro/              Agent rules and feature specs
docs/               Documentation for human developers
scripts/            Automation (bash)
apps/               Landing and admin dashboard (React)
services/           api-core (NestJS) and payment-service (Java/Spring Boot)
infra/              Docker and Nginx
packages/           Shared types/DTOs (Turborepo)
```

## Where to start

- **New developer**: read this file, then `docs/roadmap.md`, then
  `docs/team.md`.
- **New coding agent**: read `.kiro/steerings/00-project-context.md` first,
  then the relevant feature's `tasks.md` in `.kiro/specs/<feature>/`.
- **Reviewing a feature**: check `docs/feature-status.md` for current
  progress, then the feature's `design.md` for architectural decisions.
