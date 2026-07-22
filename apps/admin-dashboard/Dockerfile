FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared-types ./packages/shared-types
COPY apps/admin-dashboard ./apps/admin-dashboard

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @modula/shared-types build
RUN pnpm --filter @modula/admin-dashboard build

FROM nginx:alpine
COPY --from=builder /app/apps/admin-dashboard/dist /usr/share/nginx/html
COPY apps/admin-dashboard/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3001
