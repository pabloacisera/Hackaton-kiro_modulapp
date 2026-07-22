FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/shared-types ./packages/shared-types
COPY apps/landing ./apps/landing

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @modula/shared-types build
RUN pnpm --filter @modula/landing build

FROM nginx:alpine
COPY --from=builder /app/apps/landing/dist /usr/share/nginx/html
COPY apps/landing/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
