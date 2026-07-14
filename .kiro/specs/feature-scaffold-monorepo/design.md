# Design: Monorepo scaffolding and base infrastructure

## Monorepo structure (Turborepo)

```
modobiliario-eventos-monorepo/
├── turbo.json                    # pipeline: dev, build, lint, test
├── package.json                  # root: pnpm workspaces + turbo scripts
├── pnpm-workspace.yaml           # apps/*, services/api-core, packages/*
├── .eslintrc.js                  # shared ESLint config (root)
├── .prettierrc                   # shared Prettier config (root)
├── .husky/
│   └── pre-commit                # lint-staged on commit
├── apps/
│   ├── landing/                  # React + Vite, port 3000
│   └── admin-dashboard/          # React + Vite, port 3001
├── services/
│   ├── api-core/                 # NestJS, port 8080
│   └── payment-service/          # Spring Boot, port 8081 (NOT in Turborepo)
├── packages/
│   └── shared-types/             # TypeScript DTOs shared between apps/services
├── infra/
│   ├── docker/
│   │   ├── docker-compose.yml    # Development environment
│   │   └── docker-compose.prod.yml  # (placeholder for future)
│   └── nginx/
│       └── nginx.conf            # Reverse proxy + statics
├── scripts/
│   ├── dev-up.sh                 # docker compose up --build
│   └── seed-db.sh                # (existing, runs pnpm seed in api-core)
├── .github/
│   └── workflows/
│       └── ci.yml                # Lint + Test + Build pipeline
├── .env.example                  # All variables documented
└── README.md                     # Project overview + setup instructions
```

## React apps (landing + admin-dashboard)

Both use the same scaffold pattern:

```
apps/<name>/
├── package.json         # name, scripts: { dev, build, preview, lint, test }
├── vite.config.ts       # server.port = 3000|3001
├── tsconfig.json
├── index.html
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.tsx         # ReactDOM.createRoot
    ├── App.tsx          # Placeholder showing service name + port
    ├── models/          # Empty (MVC convention)
    ├── views/           # Empty (MVC convention)
    └── controllers/     # Empty (MVC convention)
```

Dependencies: `react`, `react-dom`, `@types/react`, `@types/react-dom`,
`typescript`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`,
`autoprefixer`.

## NestJS app (api-core)

```
services/api-core/
├── package.json                    # scripts: { dev, build, start, test, lint }
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── prisma/
│   └── schema.prisma               # Placeholder: datasource + generator only
└── src/
    ├── main.ts                     # NestFactory.create + app.listen(8080)
    ├── app.module.ts               # Root module
    └── health/
        ├── health.module.ts
        ├── health.controller.ts    # GET /health → { status: "ok" }
        └── health.service.ts
```

Dependencies: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`,
`@prisma/client`, `prisma`, `reflect-metadata`, `rxjs`, `typescript`.

## Spring Boot app (payment-service)

```
services/payment-service/
├── pom.xml                          # Spring Boot 3.x, Java 17+
├── src/main/java/com/modula/payment/
│   ├── PaymentServiceApplication.java
│   └── controller/
│       └── HealthController.java    # GET /health → { "status": "ok" }
└── src/main/resources/
    └── application.yml              # server.port=8081
```

Dependencies managed by Maven: `spring-boot-starter-web`.

## Docker Compose

```yaml
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80"]
    volumes: [./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro]
    depends_on: [landing, admin-dashboard, api-core, payment-service]
    healthcheck: curl -f http://localhost/api/health || exit 1

  landing:
    build: ./apps/landing
    expose: ["3000"]

  admin-dashboard:
    build: ./apps/admin-dashboard
    expose: ["3001"]

  api-core:
    build: ./services/api-core
    expose: ["8080"]
    env_file: .env
    depends_on: [redis]
    healthcheck: curl -f http://localhost:8080/health || exit 1

  payment-service:
    build: ./services/payment-service
    expose: ["8081"]
    env_file: .env
    healthcheck: curl -f http://localhost:8081/health || exit 1

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    healthcheck: redis-cli ping || exit 1
```

Note: PostgreSQL is NOT in docker-compose — always connects to Supabase via
`DATABASE_URL` in `.env`.

## Nginx configuration

```nginx
events { worker_connections 1024; }
http {
  upstream api { server api-core:8080; }
  upstream payments { server payment-service:8081; }
  upstream landing_upstream { server landing:3000; }
  upstream admin_upstream { server admin-dashboard:3001; }

  server {
    listen 80;

    location /api/ {
      proxy_pass http://api;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }

    location /payments/ {
      proxy_pass http://payments;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }

    location /admin/ {
      proxy_pass http://admin_upstream;
    }

    location / {
      proxy_pass http://landing_upstream;
    }
  }
}
```

## Cross-feature dependencies

- None. This feature has zero dependencies on any other feature.
- It is the prerequisite for ALL other features.

---

## ESLint + Prettier configuration

Root-level config shared across all JS/TS workspaces:

```
# .eslintrc.js (root)
module.exports = {
  root: true,
  extends: ['eslint:recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  env: { node: true, es2022: true },
  ignorePatterns: ['node_modules/', 'dist/', 'build/', '.turbo/'],
};

# .prettierrc (root)
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

Each workspace extends the root config:
- React apps: add `plugin:react/recommended`, `plugin:react-hooks/recommended`
- NestJS: no additional plugins needed (TypeScript support from root)

Dev dependencies at root: `eslint`, `@typescript-eslint/parser`,
`@typescript-eslint/eslint-plugin`, `prettier`, `eslint-config-prettier`.

Each workspace `package.json` scripts:
```json
{
  "lint": "eslint . --ext .ts,.tsx",
  "lint:fix": "eslint . --ext .ts,.tsx --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check ."
}
```

## Testing framework setup

| Workspace | Framework | Config file | Notes |
|---|---|---|---|
| `apps/landing` | Vitest | `vitest.config.ts` | React Testing Library for components |
| `apps/admin-dashboard` | Vitest | `vitest.config.ts` | React Testing Library for components |
| `services/api-core` | Jest | `jest.config.ts` | @nestjs/testing for unit tests |
| `packages/shared-types` | none | — | Types only, no runtime code to test |

Root `package.json` test script: `turbo run test` (propagates to all workspaces).

Each workspace `package.json`:
```json
{
  "test": "vitest run",          // React apps
  "test": "jest --config jest.config.ts",  // NestJS
  "test:watch": "vitest"         // or "jest --watch"
}
```

Vitest config for React apps:
```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
});
```

Jest config for NestJS:
```ts
// jest.config.ts
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

## CI pipeline (minimum viable)

`.github/workflows/ci.yml` — runs on PR and push to `main`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-test-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with: { version: 8 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint --cache-dir=.turbo/cache
      - run: pnpm turbo test --cache-dir=.turbo/cache
      - run: pnpm turbo build --cache-dir=.turbo/cache
```

Notes:
- `payment-service` (Java) is NOT in this pipeline yet — added by
  `feature-infra-deploy`.
- Turborepo remote cache can be enabled later via `TURBO_TOKEN`.
- Branch protection ("require status checks") is enabled manually after
  this pipeline runs green at least once.

## Git hooks (husky + lint-staged)

Root dev dependencies: `husky`, `lint-staged`.

Setup:
```json
// package.json (root)
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"]
  }
}
```

```
# .husky/pre-commit
#!/bin/sh
npx lint-staged
```

Behavior:
- Pre-commit hook runs lint-staged on staged files only.
- TypeScript files: ESLint fix + Prettier format.
- Non-JS files (markdown, YAML): Prettier format only.
- If ESLint finds unfixable errors, commit is blocked.

## Root README.md

Structure:
```markdown
# Modula — Modular Furniture & Events Platform

## Prerequisites
- Node.js 20+
- pnpm 8+
- Java 17+ (for payment-service)
- Docker + Docker Compose

## Quick Start
1. Clone the repo
2. Copy `.env.example` to `.env` and fill in your keys
3. Run `bash scripts/dev-up.sh`
4. Open http://localhost:3000 (landing) and http://localhost:3001 (admin)

## Architecture
- Monorepo: Turborepo (apps/* + services/api-core + packages/*)
- Frontend: React + Vite + Tailwind (MVC pattern)
- Backend: NestJS + Prisma (Clean Architecture)
- Payments: Spring Boot (isolated microservice)
- Database: PostgreSQL via Supabase
- Cache/Queues: Redis via Upstash

## Project Structure
<directory tree from design.md>

## Development
- `pnpm dev` — start all JS/TS workspaces
- `pnpm lint` — lint all workspaces
- `pnpm test` — run all tests
- `pnpm build` — build all workspaces

## Documentation
- [Feature Roadmap](docs/roadmap.md)
- [Feature Status](docs/feature-status.md)
- [Commit Conventions](docs/commit-conventions.md)
- [CI/CD](docs/ci-cd.md)
- [Project Context (Agent)](.kiro/steerings/00-project-context.md)
- [Team Workflow](.kiro/steerings/06-team-workflow.md)
```
