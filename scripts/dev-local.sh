#!/usr/bin/env bash
# dev-local.sh — Start all JS/TS services in watch mode (no Docker needed).
# Requires: Node 20+, pnpm 9+
# Payment service (Java) must be started separately: cd apps/payment-service && mvn spring-boot:run
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# ── Pre-flight checks ────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  echo "ERROR: .env file not found. Copy .env.example → .env and fill in your values."
  exit 1
fi

command -v pnpm >/dev/null 2>&1 || { echo "ERROR: pnpm not found. Install: npm install -g pnpm@9"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: node not found."; exit 1; }

# ── Install dependencies if needed ───────────────────────────────────────────
if [ ! -d "node_modules" ]; then
  echo "► Installing dependencies..."
  pnpm install
fi

# ── Start all services ────────────────────────────────────────────────────────
echo ""
echo "► Starting all JS/TS services in watch mode..."
echo ""
echo "   Landing          → http://localhost:3000"
echo "   Admin Dashboard  → http://localhost:3001"
echo "   API Core         → http://localhost:8080"
echo ""
echo "   NOTE: Payment service (Java) must be started separately:"
echo "         cd apps/payment-service && mvn spring-boot:run"
echo ""
echo "─────────────────────────────────────────────────────────"
echo ""

# Use turbo to run all dev scripts in parallel
echo "   TIP: For PayPal to work, expose port 8080 via Tailscale Funnel:"
echo "         sudo tailscale funnel 8080"
echo "         Then set APP_PUBLIC_URL in .env to your Tailscale HTTPS URL"
echo ""
pnpm dev
