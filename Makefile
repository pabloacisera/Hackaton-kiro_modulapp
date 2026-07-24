# ─── Modula — Development Commands ───────────────────────────────────────────
# Run from the repo root.

.PHONY: help install dev dev-docker stop build test lint format seed clean

# ── Help ──────────────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Setup ─────────────────────────────────────────────────────────────────────

install: ## Install all dependencies (pnpm + Maven)
	pnpm install
	@echo "✅ JS/TS dependencies installed"
	@if command -v mvn >/dev/null 2>&1; then \
		cd apps/payment-service && mvn dependency:go-offline -q; \
		echo "✅ Java dependencies downloaded"; \
	else \
		echo "⚠️  Maven not found — skip payment-service deps"; \
	fi

# ── Development ───────────────────────────────────────────────────────────────

dev: ## Start all JS/TS services (landing :3000, admin :3001, api-core :8080)
	bash scripts/dev-local.sh

dev-docker: ## Start full stack with Docker Compose (includes payment-service)
	bash scripts/dev-up.sh

dev-payment: ## Start payment-service (Java) separately
	cd apps/payment-service && mvn spring-boot:run

stop: ## Stop Docker Compose services
	docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml down

logs: ## Tail Docker Compose logs
	docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml logs -f

# ── Tailscale (HTTPS for PayPal) ──────────────────────────────────────────────

tunnel: ## Expose port 80 via Tailscale Funnel (HTTPS for PayPal callbacks)
	@echo "Exposing port 80 via Tailscale Funnel..."
	sudo tailscale funnel 80
	@echo "Set APP_PUBLIC_URL in .env to your Tailscale HTTPS URL"

tunnel-local: ## Expose port 8080 via Tailscale Funnel (for dev-local without Docker)
	@echo "Exposing port 8080 via Tailscale Funnel..."
	sudo tailscale funnel 8080
	@echo "Set APP_PUBLIC_URL in .env to your Tailscale HTTPS URL"

# ── Build ─────────────────────────────────────────────────────────────────────

build: ## Build all workspaces (JS/TS)
	pnpm build

build-payment: ## Build payment-service (Java)
	cd apps/payment-service && mvn package -DskipTests -q

build-docker: ## Build all Docker images
	docker compose -f infra/docker/docker-compose.yml build

# ── Test ──────────────────────────────────────────────────────────────────────

test: ## Run all tests (JS/TS — unit + integration)
	pnpm test

test-api: ## Run api-core tests only
	cd apps/api-core && pnpm test

test-landing: ## Run landing tests only
	cd apps/landing && pnpm test

test-admin: ## Run admin-dashboard tests only
	cd apps/admin-dashboard && pnpm test

test-payment: ## Run payment-service tests (Java)
	cd apps/payment-service && mvn test -q

test-integration: ## Run all integration tests (api-core)
	cd apps/api-core && npx jest --config jest.config.ts --testRegex ".*spec\\.ts$$" --testPathPattern "integration" --no-coverage

# ── Code Quality ──────────────────────────────────────────────────────────────

lint: ## Lint all workspaces
	pnpm lint

format: ## Format all files with Prettier
	pnpm format

format-check: ## Check formatting without writing
	pnpm format:check

typecheck: ## TypeScript type checking (no emit)
	cd apps/api-core && npx tsc --noEmit
	cd apps/landing && npx tsc --noEmit
	cd apps/admin-dashboard && npx tsc --noEmit

# ── Database & Seed ───────────────────────────────────────────────────────────

seed: ## Run database seed script
	bash scripts/seed-db.sh

prisma-generate: ## Generate Prisma client
	cd apps/api-core && npx prisma generate

prisma-migrate: ## Run Prisma migrations (dev)
	cd apps/api-core && npx prisma migrate dev

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean: ## Remove all build artifacts and node_modules
	rm -rf apps/api-core/dist
	rm -rf apps/landing/dist
	rm -rf apps/admin-dashboard/dist
	rm -rf apps/payment-service/target
	rm -rf node_modules
	rm -rf apps/*/node_modules
	rm -rf .turbo
	@echo "✅ Cleaned all build artifacts"
