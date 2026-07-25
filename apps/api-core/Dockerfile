FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Native build toolchain required by node-gyp (argon2 and other native deps)
# Also install openssl for Prisma
RUN apt-get update && apt-get install -y python3 make g++ openssl wget --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm@9

# Copy workspace root files for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY apps/api-core/package.json ./apps/api-core/package.json

RUN pnpm install

# Copy source
COPY packages/shared-types ./packages/shared-types
COPY apps/api-core ./apps/api-core

RUN pnpm --filter @modula/shared-types build
RUN pnpm --filter @modula/api-core exec prisma generate
RUN pnpm --filter @modula/api-core build

# Production: run the built NestJS app
# Same base (Debian/glibc) so argon2 + Prisma binaries are compatible
FROM node:20-bookworm-slim
WORKDIR /app

# Prisma needs openssl; wget for Docker healthcheck
RUN apt-get update && apt-get install -y openssl wget --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/apps/api-core/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api-core/package.json ./package.json
COPY --from=builder /app/apps/api-core/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 8080
CMD ["sh", "-c", "npx prisma migrate deploy 2>&1 || true; exec node dist/main"]
