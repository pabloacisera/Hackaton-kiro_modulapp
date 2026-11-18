# CI/CD Pipeline

## Overview

The pipeline runs on every push and PR to `main`, defined in
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml). It has two jobs:

1. **`lint-test-build`** — quality gate (runs on push **and** PR).
2. **`deploy`** — triggers Render deploys, **only** on a push to `main` and **only** if
   `lint-test-build` passed.

## Job 1 — `lint-test-build`

```
Install (pnpm) → prisma generate → Lint → Test → Build
```

| Step            | Tool                  | Scope                              |
| --------------- | --------------------- | ---------------------------------- |
| Install         | pnpm 9 (`--frozen-lockfile`) | All workspaces              |
| prisma generate | Prisma                | `apps/api-core` (dummy DATABASE_URL) |
| Lint            | ESLint via Turborepo  | All JS/TS packages                 |
| Test            | Jest + Vitest         | Unit + integration tests           |
| Build           | Turborepo             | All workspaces                     |

Node.js 22, pnpm cache enabled.

> **Note:** `payment-service` (Java) is **not** built or tested in CI. It is built by its
> own Dockerfile at deploy time (Render), and its tests (`mvn test`) are run locally.

## Job 2 — `deploy` (CI-gated)

```yaml
needs: lint-test-build
if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

It loops over the three Render service IDs and calls
`POST https://api.render.com/v1/services/{id}/deploys` with body
`{"clearCache":"do_not_clear"}`.

**Requirement:** the `RENDER_API_KEY` secret must be set in the GitHub repository
(Settings → Secrets and variables → Actions).

```bash
gh secret set RENDER_API_KEY --body "<your-render-api-key>"
```

Because `deploy` `needs` the quality gate and is gated on `push` to `main`, **production
only ever receives code that passed lint + tests + build**, and PRs never deploy.

## Branch protection

Once the pipeline has run green at least once, enable **"require status checks"** on
`main` in GitHub branch protection rules.
