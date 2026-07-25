FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9

# Copy workspace root files for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY apps/admin-dashboard/package.json ./apps/admin-dashboard/package.json

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared-types ./packages/shared-types
COPY apps/admin-dashboard ./apps/admin-dashboard

RUN pnpm --filter @modula/shared-types build

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm --filter @modula/admin-dashboard build

# Production: serve static files with nginx
FROM nginx:alpine
COPY --from=builder /app/apps/admin-dashboard/dist /usr/share/nginx/html
# SPA fallback: serve admin SPA under /admin/ prefix (matches Vite base config)
COPY apps/admin-dashboard/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
