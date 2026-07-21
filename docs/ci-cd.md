# CI/CD Pipeline

## Overview

The CI pipeline runs on every PR and push to `main`. It is initially created by
`TASK-auth-12` (feature-admin-auth-core) and extended by `TASK-infra-9`
(feature-infra-deploy).

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
<<<<<<< HEAD
Turborepo pipeline. It is added by `TASK-infra-10`.

## Branch protection

After `TASK-auth-12` is merged and the pipeline has run green at least once,
enable "require status checks" on `main` in GitHub branch protection rules.
