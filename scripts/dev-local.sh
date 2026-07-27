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
# Write a clean env file that bash can source safely
ENV_TMP=$(mktemp)
while IFS= read -r line || [ -n "$line" ]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  if [[ "$line" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
    key="${line%%=*}"
    value="${line#*=}"
    # Strip surrounding quotes
    value="${value#\"}"
    value="${value%\"}"
    value="${value#\'}"
    value="${value%\'}"
    # Write as properly quoted export
    printf 'export %s=%q\n' "$key" "$value" >> "$ENV_TMP"
  fi
done < .env
source "$ENV_TMP"
rm -f "$ENV_TMP"
ok "Loaded .env variables"

# ── Java setup ───────────────────────────────────────────────────────────────
HAS_JAVA=false
HAS_MAVEN=false

if command -v java >/dev/null 2>&1; then
  HAS_JAVA=true
fi
if command -v mvn >/dev/null 2>&1; then
  HAS_MAVEN=true
fi

# Prefer Java 17 for payment-service compatibility
JAVA17_HOME=""
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

# ── Create log directory ─────────────────────────────────────────────────────
LOG_DIR=$(mktemp -d)

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
  jobs -p | xargs -r kill 2>/dev/null || true
  wait 2>/dev/null
  rm -rf "$LOG_DIR"
  ok "All services stopped."
}
trap cleanup EXIT INT TERM

# ── Start API Core (NestJS --watch) ──────────────────────────────────────────
echo ""
echo -e "${CYAN}[api-core]${NC} Starting on port 8080 (hot reload: nest --watch)..."
(cd apps/api-core && exec pnpm dev) > >(sed "s/^/$(printf '\033[0;36m')[api-core]$(printf '\033[0m') /") 2>&1 &
PIDS+=($!)
sleep 2

# ── Start Landing (Vite HMR) ────────────────────────────────────────────────
echo -e "${GREEN}[landing]${NC} Starting on port 3000 (hot reload: Vite HMR)..."
(exec pnpm --filter @modula/landing dev) > >(sed "s/^/$(printf '\033[0;32m')[landing]$(printf '\033[0m') /") 2>&1 &
PIDS+=($!)
sleep 1

# ── Start Admin Dashboard (Vite HMR) ────────────────────────────────────────
echo -e "${MAGENTA}[admin]${NC} Starting on port 3001 (hot reload: Vite HMR)..."
(exec pnpm --filter @modula/admin-dashboard dev) > >(sed "s/^/$(printf '\033[0;35m')[admin]$(printf '\033[0m') /") 2>&1 &
PIDS+=($!)
sleep 1

# ── Start Payment Service (Spring Boot DevTools) ─────────────────────────────
if [ "$HAS_JAVA" = true ] && [ "$HAS_MAVEN" = true ]; then
  echo -e "${BLUE}[payment]${NC} Starting on port 8081 (hot reload: spring-boot-devtools)..."

  JAVA_HOME_EXPORT=""
  if [ -n "$JAVA17_HOME" ]; then
    JAVA_HOME_EXPORT="JAVA_HOME=$JAVA17_HOME"
    echo -e "${BLUE}[payment]${NC} Using Java 17: $JAVA17_HOME"
  fi

  (cd apps/payment-service && exec env $JAVA_HOME_EXPORT mvn spring-boot:run \
    -Dspring-boot.run.fork=true \
    -Dspring-boot.run.jvmArguments="-Dspring.devtools.restart.enabled=true") \
    > >(sed "s/^/$(printf '\033[0;34m')[payment]$(printf '\033[0m') /") 2>&1 &
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
