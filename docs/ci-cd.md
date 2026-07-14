# CI/CD Pipeline

## Overview

The CI pipeline runs on every PR and push to `main`. It is initially created by
`TASK-scaffold-11` (feature-scaffold-monorepo) as a minimum viable pipeline
(lint + test + build). It is extended by `TASK-infra-5` (feature-infra-deploy)
with Docker image builds and Maven job.

## Pipeline stages

```
Lint → Test → Build (Turborepo cache) → Docker image build → Deploy
```

| Stage | Tool | Scope |
|---|---|---|
| Lint | ESLint | All JS/TS packages |
| Test | Jest (backend), Vitest (frontend) | Unit + integration tests |
| Build | Turborepo | All workspaces |
| Docker | Docker buildx | api-core, payment-service |
| Maven | Maven | payment-service (parallel to Turborepo) |

## Workflow file

`.github/workflows/ci.yml`

## Payment service (Java)

`payment-service` has its own Maven build job that runs in parallel to the
Turborepo pipeline. It is added by `TASK-infra-5`.

## Branch protection

After `TASK-scaffold-11` is merged and the pipeline has run green at least once,
enable "require status checks" on `main` in GitHub branch protection rules.
