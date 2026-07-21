# apps/api-core

Backend domain. NestJS + TypeScript, Clean Architecture (see
`.kiro/steerings/05-architecture-conventions.md`).

```
src/
  domain/            # entities, pure business rules
  application/       # use cases
  infrastructure/    # DB (Prisma), Redis, BullMQ, SSE, email
  interface/         # HTTP controllers, DTOs, guards
```

Domains: `catalog`, `orders`, `quotes`, `supplies`,
`complaints`, `notifications`, `auth`. Does not handle payments or
receipts directly — delegates to `apps/payment-service` via HTTP/webhooks.

## Development

```bash
npm run dev
```

Runs on http://localhost:8080.

## Database

Uses Prisma ORM with PostgreSQL (Supabase).

```bash
npx prisma migrate dev    # Run migrations
npx prisma generate       # Generate Prisma Client
npx prisma studio         # Open Prisma Studio
```

## Testing

```bash
npm run test        # Unit tests
npm run test:e2e    # Integration tests
```

## Environment variables

See `.kiro/steerings/09-environment-variables.md`. All variables must be in `.env` file.
