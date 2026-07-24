#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# prod-up.sh — Start all services in production mode
# Run from the repository root: bash scripts/prod-up.sh
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.prod.yml"

# ── Pre-flight checks ────────────────────────────────────────────────────────
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "ERROR: .env file not found at repo root."
  echo "       You must create and populate .env before starting production."
  echo "       See: docs/terraform-guide.md → Step 5"
  exit 1
fi

command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "ERROR: docker compose not found."; exit 1; }

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         ModulaApp — Production Deployment                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# ── Build and start ──────────────────────────────────────────────────────────
echo "► Building and starting all production services..."
docker compose -f "$COMPOSE_FILE" up --build -d

echo ""
echo "► Waiting for services to become healthy..."

# Wait for health checks (Docker Compose handles ordering via depends_on + condition)
TIMEOUT=300
ELAPSED=0

while true; do
  UNHEALTHY=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | \
    grep -c '"Health":"starting"' || true)

  if [ "$UNHEALTHY" -eq 0 ]; then
    break
  fi

  sleep 5
  ELAPSED=$((ELAPSED + 5))

  if [ $ELAPSED -ge $TIMEOUT ]; then
    echo ""
    echo "ERROR: Services did not become healthy within ${TIMEOUT}s."
    echo "Check logs: docker compose -f $COMPOSE_FILE logs"
    exit 1
  fi

  echo -n "."
done

echo ""
echo ""
echo "✅ All production services are running:"
echo ""
docker compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "Health check: curl http://localhost/health"
echo "Stop:         docker compose -f $COMPOSE_FILE down"
echo "Logs:         docker compose -f $COMPOSE_FILE logs -f"
echo "Rebuild:      docker compose -f $COMPOSE_FILE up --build -d"
