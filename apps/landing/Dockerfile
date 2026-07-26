FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9

# Copy workspace root files for dependency resolution
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY apps/landing/package.json ./apps/landing/package.json

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared-types ./packages/shared-types
COPY apps/landing ./apps/landing

RUN pnpm --filter @modula/shared-types build

ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN pnpm --filter @modula/landing build

# Production: serve static files with nginx
FROM nginx:alpine
COPY --from=builder /app/apps/landing/dist /usr/share/nginx/html
# SPA fallback: all routes serve index.html
RUN echo 'server { listen 80; root /usr/share/nginx/html; location / { try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf
EXPOSE 80
