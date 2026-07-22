#!/usr/bin/env bash
# dev-up.sh — Start the full local stack and wait for all services to be healthy.
# Run from the repository root: bash scripts/dev-up.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.yml"
TIMEOUT=120

# ── Pre-flight checks ────────────────────────────────────────────────────────
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "ERROR: .env file not found at repo root."
  echo "       Copy .env.example → .env and fill in your values."
  exit 1
fi

command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found."; exit 1; }
command -v docker compose >/dev/null 2>&1 || docker-compose version >/dev/null 2>&1 || { echo "ERROR: docker compose not found."; exit 1; }

echo "► Building and starting all services..."
docker compose -f "$COMPOSE_FILE" up --build -d

# ── Wait for health checks ───────────────────────────────────────────────────
wait_healthy() {
  local service=$1
  local url=$2
  local elapsed=0

  echo -n "  Waiting for $service ($url)..."
  until curl -sf "$url" >/dev/null 2>&1; do
    sleep 2
    elapsed=$((elapsed + 2))
    if [ $elapsed -ge $TIMEOUT ]; then
      echo " TIMEOUT"
      echo "ERROR: $service did not become healthy within ${TIMEOUT}s."
      docker compose -f "$COMPOSE_FILE" logs "$service" | tail -20
      exit 1
    fi
    echo -n "."
  done
  echo " ✓"
}

wait_healthy "api-core"         "http://localhost:8080/health"
wait_healthy "payment-service"  "http://localhost:8081/health"
wait_healthy "landing"          "http://localhost:3000"
wait_healthy "admin-dashboard"  "http://localhost:3001"

# ── Redis ────────────────────────────────────────────────────────────────────
echo -n "  Waiting for redis..."
until docker compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; do
  sleep 2
done
echo " ✓"

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "✅ All services are up:"
echo "   Landing          → http://localhost:3000"
echo "   Admin Dashboard  → http://localhost:3001"
echo "   API Core         → http://localhost:8080"
echo "   Payment Service  → http://localhost:8081"
echo "   Nginx (proxy)    → http://localhost:80"
echo ""
echo "   /api/health      → http://localhost/api/health"
echo "   /payments/health → http://localhost/payments/health"
echo ""
echo "Run 'docker compose -f infra/docker/docker-compose.yml logs -f' to tail logs."
