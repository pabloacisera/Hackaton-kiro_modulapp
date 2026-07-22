FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared-types ./packages/shared-types
COPY apps/api-core ./apps/api-core

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @modula/shared-types build
RUN pnpm --filter @modula/api-core build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm@9

COPY --from=builder /app/apps/api-core/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api-core/package.json ./package.json

EXPOSE 8080
CMD ["node", "dist/main"]
