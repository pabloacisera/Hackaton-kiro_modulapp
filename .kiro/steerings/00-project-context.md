# Project Context — Global Steering

> This document is ALWAYS read before generating any spec, task, or code.
> Every agent (Kiro or other) must respect these decisions without reinterpretation.

## What the system is

A platform for selling modular furniture (MDF) and arches for events, with two
business flows that converge at the same checkout but behave differently:

- **Flow A — Direct purchase**: the customer chooses a prototype that is already
  manufactured and priced, pays, and the admin accepts or rejects the order.
- **Flow B — Custom quote**: the customer describes what they need, the admin
  quotes, the customer accepts/rejects via email, and if they accept they must pay
  within a limited time window.

## Business decisions (NOT negotiable without explicit owner authorization)

| Topic | Decision |
|---|---|
| Invoicing | Internal **non-fiscal** receipt. The system is global via PayPal. |
| Currency | **USD only** throughout the platform. |
| Customer identity | **No user account.** Everything is resolved via email + signed tokens (magic links) in emails. |
| Required data (Flow B) | Name, email, and phone are required in every quote request. If missing, the system may discard the order and **must notify the admin** of the discard. In Flow A (direct purchase) this strict validation does not apply the same way because payment has already been made. |
| Admin authentication | Proprietary JWT (hashed login/password). Multiple admins, **all with the same permissions** (no differentiated roles). |
| Stock deduction (Flow A) | Stock is deducted **only when the admin ACCEPTS** the order. If rejected, the system triggers automatic refund and **no** stock deduction occurs. |
| Quote expiration (Flow B) | 48 hours for the customer to respond to the quote; if accepted, 24 hours to pay. Automatic job marks the quote as **"expired"**, but the admin must archive/delete it manually (no auto-deletion). |
| Refunds | **Automatic** via PayPal Refunds API, both on order rejection (Flow A) and approved complaints. |
| Language | **Spanish** is the default; landing and transactional emails also ship in **English** via i18n from day one (see `feature-i18n-localization`). |
| Payments | PayPal as the sole gateway. All payment logic lives isolated in the financial microservice. |
| Email provider | **Mailjet** for transactional emails. Accounts will be created with a dedicated project email. |
| ORM | **Prisma** for NestJS api-core. TypeORM is not used. |
| Icon library | **FontAwesome** (free tier) for icons in landing and admin dashboard. |

## Fixed technology stack

- **Monorepo**: Turborepo (apps/services JS-TS). Java remains outside the Turborepo
  graph, as an independent service orchestrated only by Docker Compose.
- **Frontend** (landing + admin dashboard): React, MVC architecture, mobile-first,
  responsive, Figma design before coding.
- **Backend domain**: NestJS + TypeScript, Clean Architecture (layers: domain,
  application, infrastructure, interface).
- **Financial microservice**: Java + Spring Boot. Exclusive responsibility for:
  payment (PayPal Orders API), refunds (PayPal Refunds API), generation and sending of
  receipts/tickets (non-fiscal) to customer and admin. Java is chosen for its
  robustness in critical financial operations — this service is untouchable from
  other languages except via its HTTP API.
- **Scheduled jobs**: BullMQ + Redis (Upstash) for: quote expiration,
  payment window expiration, email reminders, minimum stock hour check.
- **Realtime**: SSE from backend to **landing** (syncs catalog price/stock in
  real-time). WebSockets in **admin dashboard** (notifications, alarms,
  non-intrusive sound).
- **Persistence**: PostgreSQL via Supabase. Cache/queues via Redis (Upstash).
- **Infrastructure**: Docker + Docker Compose, Nginx serving React static builds
  in production.

## Golden rule: never lose sync between landing ↔ admin

Any price, stock, or availability change of a manufactured prototype made from the
admin **must** propagate to the landing in real-time (SSE) before the customer can
pay for something outdated. No feature touching the catalog is considered
complete without this mechanism tested.

## Working language

All documentation (specs, steerings, hooks) is written in **English**. Code,
variable names, commits, and technical comments are written in **English**.

## Environment variables — Immutable rule

Once `.env` is created and populated with real keys, it **cannot** be modified,
edited, or deleted. Any change to environment variables must be documented first
in `.kiro/steerings/09-environment-variables.md` and then manually applied by the developer.

## Branch and commit conventions

- **Features**: each feature gets its own branch following the pattern:
  `<number>-feature-<feature-name>` (e.g., `1-feature-admin-auth-core`).
  **Branches are always created in the developer's fork**, never in the
  owner's repo.
- **Sequential dependencies**: features are numbered and must be completed in
  order. A developer cannot start feature N+1 until feature N is merged to
  `main`. The owner coordinates this sequence.
- **Issues with multiple tasks**: issues that require more than one microtask get
  their own branch: `<number>-fix-issue-<issue-id>-<slug>`
- **Small fixes / single tasks**: if the change is small enough (1-2 files, no
  tests needed), commit directly to `main` (or the feature branch if the fix
  belongs to an active feature) following commit message conventions (see `docs/commit-conventions.md`).
- **Impact-based authorization**: the severity/impact of a change can also
  authorize branch creation. A high-impact change (even if small) should get
  its own branch for safety.

## Commit ownership

Commits belong to whoever made them (the author), not to the project owner.

| Who | Can commit to... | Owns commits in... |
|---|---|---|
| **Owner** | Any branch in the repo | Branches they created |
| **Developer** | Their own branches (in their fork) | Their fork |
| **Agent** | Branches it created (with approval) | Branches it created |

**Key rules:**
- The project owner does NOT own all commits — only the author does
- The project owner controls what enters `main` (via merge)
- Developers own their commits in their forks
- The agent owns its commits in branches it created
- **NOBODY** can commit directly to `main` without owner approval

## Authorization points for the agent

The agent MUST stop and ask for human authorization at these points:

1. **Before starting a new feature** — confirm readiness and any open questions.
2. **Before creating a branch** — confirm the branch name and scope.
3. **After completing all tasks in a feature** — present summary before merge.
4. **When encountering ambiguous business logic** — never assume, always ask.
5. **Before merging any PR** — wait for human approval.
6. **When a decision contradicts existing specs** — pause and clarify.
7. **Before committing directly to main** — even small fixes require owner confirmation.
8. **Before updating ANY documentation** — feature-status.md, collaboration-log.md, team.md, or any other doc.
9. **Before creating a branch based on another feature branch that has not yet been merged to main** — confirm it is safe (the dependency branch may still change).

> **Note (informational):** Merge access to `main` is enforced at the GitHub repository level (branch protection: restrict push to `main` to the owner's account only, collaborators only have Read access and work via forks). This is configured outside the agent's control and must not be re-implemented, bypassed, or checked by the agent itself.

> **Note (informational):** Whenever an agent performs `git fetch upstream` + `git rebase upstream/main` on a collaborator's behalf, it must report back before doing any further work: (1) list of new commits/PRs landed upstream since the last sync, with author and one-line summary each; (2) files/directories those commits touched; (3) an explicit flag — "Possible overlap" or "No overlap detected" — comparing those files against the collaborator's current in-progress task in `tasks.md` / `docs/feature-status.md`. This is a mandatory report, not a question — it does not require stopping for owner approval, only informing the human before proceeding.

## Team workflow

For the complete workflow explanation (roles, PR process, code review,
triple layer of protection), see `06-team-workflow.md`.

**Key rule: Only the owner can merge to `main`. Everyone else creates PRs and waits.**
