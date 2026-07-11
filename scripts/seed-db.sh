#!/usr/bin/env bash
set -euo pipefail

# Corre el seeder de datos falsos (mock) contra la DB apuntada por DATABASE_URL.
# Ver TASK-infra-8 en .kiro/specs/feature-infra-deploy/tasks.md

echo "Corriendo seed de datos falsos..."
cd services/api-core
pnpm run seed
