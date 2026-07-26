#!/usr/bin/env bash
# dev-up.sh — Start the full local stack with Docker Compose.
# Run from the repository root: bash scripts/dev-up.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.yml"
TIMEOUT=180

# ── Pre-flight checks ────────────────────────────────────────────────────────
if [ ! -f "$ROOT_DIR/.env" ]; then
  echo "ERROR: .env file not found at repo root."
  echo "       Copy .env.example → .env and fill in your values."
  exit 1
fi

command -v docker >/dev/null 2>&1 || { echo "ERROR: docker not found."; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "ERROR: docker compose not found."; exit 1; }

echo "► Building and starting all services (dev mode with source bind mounts)..."
docker compose -f "$COMPOSE_FILE" up --build -d

# ── Wait for health checks ───────────────────────────────────────────────────
wait_healthy() {
  local service=$1
  local url=$2
  local elapsed=0

  echo -n "  Waiting for $service ($url)..."
  until curl -sf "$url" >/dev/null 2>&1; do
    sleep 3
    elapsed=$((elapsed + 3))
    if [ $elapsed -ge $TIMEOUT ]; then
      echo " TIMEOUT"
      echo "ERROR: $service did not become healthy within ${TIMEOUT}s."
      docker compose -f "$COMPOSE_FILE" logs "$service" | tail -30
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

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo "✅ All services are up:"
echo "   Landing          → http://localhost:3000"
echo "   Admin Dashboard  → http://localhost:3001"
echo "   API Core         → http://localhost:8080"
echo "   Payment Service  → http://localhost:8081"
echo "   Nginx (proxy)    → http://localhost:8082"
echo ""
echo "To stop:  docker compose -f infra/docker/docker-compose.yml down"
echo "To logs:  docker compose -f infra/docker/docker-compose.yml logs -f"

# ── Tailscale Funnel (HTTPS for PayPal callbacks) ────────────────────────────
if command -v tailscale >/dev/null 2>&1; then
  echo ""
  echo "► Activating Tailscale Funnel on port 80 (HTTPS for PayPal webhooks)..."
  sudo tailscale funnel --bg 80 2>/dev/null || tailscale funnel --bg 80 2>/dev/null || {
    echo "  ⚠️  Could not start funnel automatically. Run manually:"
    echo "     sudo tailscale funnel 80"
  }
  FUNNEL_URL="https://$(tailscale status --self --json 2>/dev/null | grep -o '"DNSName":"[^"]*"' | cut -d'"' -f4 | sed 's/\.$//')"
  echo "  ✓ Funnel active: $FUNNEL_URL"
  echo ""
  echo "  Make sure APP_PUBLIC_URL in .env matches: $FUNNEL_URL"
  echo "  PayPal webhook URL: ${FUNNEL_URL}/payments/webhooks/paypal"
fi
