#!/bin/bash
# ──────────────────────────────────────────────────────────────────────────────
# user-data.sh — Cloud-init script for EC2 instance bootstrap
# This runs ONCE when the instance is first launched.
# Logs: /var/log/cloud-init-output.log
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
exec > >(tee /var/log/user-data.log) 2>&1

echo "════════════════════════════════════════════════════════════════"
echo " ModulaApp — EC2 Bootstrap"
echo " Started: $(date -Iseconds)"
echo "════════════════════════════════════════════════════════════════"

# ── 1. System updates ────────────────────────────────────────────────────────
echo "► Installing system packages..."
dnf update -y -q
dnf install -y -q docker git

# ── 2. Docker ────────────────────────────────────────────────────────────────
echo "► Starting Docker..."
systemctl enable docker
systemctl start docker
usermod -aG docker ec2-user

# Docker Compose plugin (v2)
echo "► Installing Docker Compose plugin..."
DOCKER_CONFIG=/usr/local/lib/docker/cli-plugins
mkdir -p "$DOCKER_CONFIG"
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
curl -SL "https://github.com/docker/compose/releases/download/$${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o "$DOCKER_CONFIG/docker-compose"
chmod +x "$DOCKER_CONFIG/docker-compose"

# Verify installation
docker --version
docker compose version

# ── 3. Clone repository ──────────────────────────────────────────────────────
APP_DIR="/opt/${project_name}"

if [ -n "${app_repo_url}" ]; then
  echo "► Cloning repository..."
  git clone --branch "${app_branch}" --depth 1 "${app_repo_url}" "$APP_DIR"
else
  echo "► No repo URL provided. Creating app directory for manual deployment."
  mkdir -p "$APP_DIR/infra/docker"
fi

chown -R ec2-user:ec2-user "$APP_DIR"

# ── 4. Environment file placeholder ─────────────────────────────────────────
# The .env file MUST be manually uploaded after instance creation.
# It is NEVER part of Terraform state or user-data for security reasons.
if [ ! -f "$APP_DIR/.env" ]; then
  echo "► Creating .env placeholder (MUST be filled manually)..."
  cat > "$APP_DIR/.env" <<'ENVFILE'
# ═══════════════════════════════════════════════════════════════════════════════
# THIS FILE MUST BE POPULATED MANUALLY
# See: docs/terraform-guide.md → Step 5: Upload .env
# ═══════════════════════════════════════════════════════════════════════════════
# Copy your real .env values here. The app will NOT start without them.
ENVFILE
fi

# ── 5. Cloudflare Tunnel (reverse tunnel for HTTPS) ──────────────────────────
if [ -n "${cloudflare_tunnel_token}" ]; then
  echo "► Installing Cloudflare Tunnel (cloudflared)..."
  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
    -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared

  # Install as a systemd service with the provided token
  cloudflared service install "${cloudflare_tunnel_token}"
  systemctl enable cloudflared
  systemctl start cloudflared
  echo "✓ Cloudflare Tunnel running"
else
  echo "► Skipping Cloudflare Tunnel (no token provided)."
  echo "  To set up later: cloudflared service install <TOKEN>"
fi

# ── 6. Systemd service for Docker Compose ────────────────────────────────────
echo "► Creating systemd service for auto-start on reboot..."
cat > /etc/systemd/system/${project_name}-app.service <<EOF
[Unit]
Description=ModulaApp Docker Compose
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/lib/docker/cli-plugins/docker-compose -f infra/docker/docker-compose.prod.yml up -d --build
ExecStop=/usr/local/lib/docker/cli-plugins/docker-compose -f infra/docker/docker-compose.prod.yml down
TimeoutStartSec=600

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${project_name}-app.service

# ── 7. Start the app (only if .env has real values) ──────────────────────────
# We DON'T auto-start because .env needs to be manually configured first.
# After uploading .env, run: sudo systemctl start modula-app
echo ""
echo "════════════════════════════════════════════════════════════════"
echo " ✓ Bootstrap complete!"
echo ""
echo " NEXT STEPS (manual):"
echo "   1. SSH/SSM into the instance"
echo "   2. Edit /opt/${project_name}/.env with real values"
echo "   3. Start the app:"
echo "      sudo systemctl start ${project_name}-app"
echo "   4. Check status:"
echo "      sudo systemctl status ${project_name}-app"
echo "      docker compose -f $APP_DIR/infra/docker/docker-compose.prod.yml logs -f"
echo "════════════════════════════════════════════════════════════════"
