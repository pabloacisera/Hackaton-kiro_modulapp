#!/usr/bin/env bash
# dev-local.sh — Start all app services in dev mode (no Docker needed).
# Uses remote databases/redis configured in .env
# Requires: Node 20+, pnpm 9+, Java 17+ & Maven (optional, for payment-service)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()  { echo -e "${CYAN}►${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC} $*"; }
fail()  { echo -e "${RED}✗${NC} $*"; }

# ── Pre-flight checks ────────────────────────────────────────────────────────
if [ ! -f ".env" ]; then
  fail ".env file not found."
  echo "  Copy .env.example → .env and fill in your values."
  exit 1
fi

command -v pnpm >/dev/null 2>&1 || { fail "pnpm not found. Install: npm install -g pnpm@9"; exit 1; }
command -v node >/dev/null 2>&1 || { fail "node not found."; exit 1; }

HAS_JAVA=false
HAS_MAVEN=false
command -v java >/dev/null 2>&1 && HAS_JAVA=true
command -v mvn >/dev/null 2>&1 && HAS_MAVEN=true

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  ModulaApp — Local Development Stack${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

# ── Install dependencies ─────────────────────────────────────────────────────
info "Installing JS/TS dependencies..."
if [ ! -d "node_modules" ]; then
  pnpm install
else
  ok "node_modules exists, running pnpm install (fast)..."
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
fi

# ── Prisma generate ──────────────────────────────────────────────────────────
info "Generating Prisma client..."
(cd apps/api-core && npx prisma generate 2>&1 | tail -1) || warn "Prisma generate failed"

# ── Track child PIDs for cleanup ─────────────────────────────────────────────
PIDS=()
cleanup() {
  echo ""
  info "Shutting down all services..."
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill -TERM "$pid" 2>/dev/null || true
    fi
  done
  wait 2>/dev/null
  ok "All services stopped."
}
trap cleanup EXIT INT TERM

# ── Start API Core ───────────────────────────────────────────────────────────
info "Starting api-core (port 8080)..."
(cd apps/api-core && pnpm dev) &
PIDS+=($!)
sleep 2

# ── Start Landing ────────────────────────────────────────────────────────────
info "Starting landing (port 3000)..."
(pnpm --filter @modula/landing dev) &
PIDS+=($!)
sleep 1

# ── Start Admin Dashboard ────────────────────────────────────────────────────
info "Starting admin-dashboard (port 3001)..."
(pnpm --filter @modula/admin-dashboard dev) &
PIDS+=($!)
sleep 1

# ── Start Payment Service (Java) ─────────────────────────────────────────────
if [ "$HAS_JAVA" = true ] && [ "$HAS_MAVEN" = true ]; then
  info "Starting payment-service (port 8081)..."
  (cd apps/payment-service && mvn spring-boot:run -q) &
  PIDS+=($!)
else
  warn "Skipping payment-service (Java/Maven not available)"
  echo "  Install Java 17+:  sudo apt install openjdk-17-jdk"
  echo "  Install Maven:     sudo apt install maven"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  All services starting...${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}Landing${NC}          → http://localhost:3000"
echo -e "  ${GREEN}Admin Dashboard${NC}  → http://localhost:3001"
echo -e "  ${GREEN}API Core${NC}         → http://localhost:8080"
if [ "$HAS_JAVA" = true ] && [ "$HAS_MAVEN" = true ]; then
  echo -e "  ${GREEN}Payment Service${NC}  → http://localhost:8081"
fi
echo ""
echo -e "  ${YELLOW}DB/Redis:${NC} Using remote services from .env"
echo -e "  ${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# ── Wait for all children ────────────────────────────────────────────────────
wait
