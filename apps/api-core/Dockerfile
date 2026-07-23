FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9

# Copy workspace root files for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY apps/api-core/package.json ./apps/api-core/package.json

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared-types ./packages/shared-types
COPY apps/api-core ./apps/api-core

RUN pnpm --filter @modula/shared-types build
RUN pnpm --filter @modula/api-core build

# Production: run the built NestJS app
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/apps/api-core/dist ./dist
COPY --from=builder /app/apps/api-core/node_modules ./node_modules
COPY --from=builder /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder /app/apps/api-core/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 8080
CMD ["node", "dist/main"]
