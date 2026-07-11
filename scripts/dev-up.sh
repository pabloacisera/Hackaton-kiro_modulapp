#!/usr/bin/env bash
set -euo pipefail

# Levanta todo el entorno de desarrollo local vía Docker Compose.
# Requiere un .env completo en la raíz (ver docs/variables-de-entorno.md).

if [ ! -f .env ]; then
  echo "Falta el archivo .env en la raíz. Copiá .env.example y completá los valores."
  exit 1
fi

docker compose -f infra/docker/docker-compose.yml up --build
