# Design: Monorepo scaffolding and base infrastructure

## Monorepo structure (Turborepo)

```
modobiliario-eventos-monorepo/
├── turbo.json                    # pipeline: dev, build, lint, test
├── package.json                  # root: pnpm workspaces + turbo scripts
├── pnpm-workspace.yaml           # apps/*, services/api-core, packages/*
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
└── .env.example                  # All variables documented
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
