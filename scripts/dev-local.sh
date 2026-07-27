#!/usr/bin/env bash
# dev-local.sh — Start all app services in dev mode with hot reload.
# Uses remote databases/redis configured in .env
# Requires: Node 20+, pnpm 9+, Java 17+ & Maven (optional, for payment-service)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# ── Colors & prefixes ─────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

PREFIX_API="${CYAN}[api-core]${NC}"
PREFIX_LANDING="${GREEN}[landing]${NC}"
PREFIX_ADMIN="${MAGENTA}[admin]${NC}"
PREFIX_PAYMENT="${BLUE}[payment]${NC}"

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

# ── Load .env into environment ───────────────────────────────────────────────
set -a
source .env
set +a
ok "Loaded .env variables"

# ── Java setup ───────────────────────────────────────────────────────────────
HAS_JAVA=false
HAS_MAVEN=false
JAVA17_HOME=""

if command -v java >/dev/null 2>&1; then
  HAS_JAVA=true
fi
if command -v mvn >/dev/null 2>&1; then
  HAS_MAVEN=true
fi

# Prefer Java 17 for payment-service compatibility
if [ -d "/usr/lib/jvm/java-17-openjdk-amd64" ]; then
  JAVA17_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
elif [ -d "/usr/lib/jvm/java-17-openjdk" ]; then
  JAVA17_HOME="/usr/lib/jvm/java-17-openjdk"
fi

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  ModulaApp — Local Development (Hot Reload)${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""

# ── Install dependencies ─────────────────────────────────────────────────────
info "Installing JS/TS dependencies..."
if [ ! -d "node_modules" ]; then
  pnpm install
else
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
fi
ok "Dependencies ready"

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
  # Kill any remaining children
  jobs -p | xargs -r kill 2>/dev/null || true
  wait 2>/dev/null
  ok "All services stopped."
}
trap cleanup EXIT INT TERM

# ── Start API Core (NestJS --watch) ──────────────────────────────────────────
echo ""
echo -e "${PREFIX_API} Starting on port 8080 (hot reload: nest --watch)..."
(cd apps/api-core && pnpm dev 2>&1 | while IFS= read -r line; do
  echo -e "${PREFIX_API} $line"
done) &
PIDS+=($!)
sleep 2

# ── Start Landing (Vite HMR) ────────────────────────────────────────────────
echo -e "${PREFIX_LANDING} Starting on port 3000 (hot reload: Vite HMR)..."
(pnpm --filter @modula/landing dev 2>&1 | while IFS= read -r line; do
  echo -e "${PREFIX_LANDING} $line"
done) &
PIDS+=($!)
sleep 1

# ── Start Admin Dashboard (Vite HMR) ────────────────────────────────────────
echo -e "${PREFIX_ADMIN} Starting on port 3001 (hot reload: Vite HMR)..."
(pnpm --filter @modula/admin-dashboard dev 2>&1 | while IFS= read -r line; do
  echo -e "${PREFIX_ADMIN} $line"
done) &
PIDS+=($!)
sleep 1

# ── Start Payment Service (Spring Boot DevTools) ─────────────────────────────
if [ "$HAS_JAVA" = true ] && [ "$HAS_MAVEN" = true ]; then
  echo -e "${PREFIX_PAYMENT} Starting on port 8081 (hot reload: spring-boot-devtools)..."

  PAYMENT_ENV=""
  if [ -n "$JAVA17_HOME" ]; then
    PAYMENT_ENV="JAVA_HOME=$JAVA17_HOME"
    echo -e "${PREFIX_PAYMENT} Using Java 17: $JAVA17_HOME"
  fi

  (cd apps/payment-service && env $PAYMENT_ENV mvn spring-boot:run \
    -Dspring-boot.run.fork=true \
    -Dspring-boot.run.jvmArguments="-Dspring.devtools.restart.enabled=true" \
    2>&1 | while IFS= read -r line; do
    # Highlight restart events
    if echo "$line" | grep -q "Restarting\|restart\|Started.*in"; then
      echo -e "${PREFIX_PAYMENT} ${YELLOW}${line}${NC}"
    else
      echo -e "${PREFIX_PAYMENT} $line"
    fi
  done) &
  PIDS+=($!)
else
  warn "Skipping payment-service (Java/Maven not available)"
  echo "  Install: sudo apt install openjdk-17-jdk maven"
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BOLD}  Services starting with hot reload...${NC}"
echo -e "${BOLD}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}Landing${NC}          → http://localhost:3000       ${GREEN}(Vite HMR)${NC}"
echo -e "  ${GREEN}Admin Dashboard${NC}  → http://localhost:3001/admin ${GREEN}(Vite HMR)${NC}"
echo -e "  ${GREEN}API Core${NC}         → http://localhost:8080       ${GREEN}(nest --watch)${NC}"
if [ "$HAS_JAVA" = true ] && [ "$HAS_MAVEN" = true ]; then
  echo -e "  ${GREEN}Payment Service${NC}  → http://localhost:8081       ${GREEN}(devtools)${NC}"
fi
echo ""
echo -e "  ${YELLOW}DB/Redis:${NC} Using remote services from .env"
echo -e "  ${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# ── Wait for all children ────────────────────────────────────────────────────
wait
