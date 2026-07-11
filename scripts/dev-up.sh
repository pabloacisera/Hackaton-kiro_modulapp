#!/usr/bin/env bash
set -euo pipefail

# Starts the full local development environment via Docker Compose.
# Requires a complete .env in the project root (see .kiro/steerings/09-environment-variables.md).

if [ ! -f .env ]; then
  echo "Missing .env file in the project root. Copy .env.example and fill in the values."
  exit 1
fi

docker compose -f infra/docker/docker-compose.yml up --build
