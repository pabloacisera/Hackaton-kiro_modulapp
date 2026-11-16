#!/usr/bin/env bash
# Uploads the seed product images to Supabase Storage.
#
# The api-core seed references these objects as:
#   ${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/products/seed-<slug>.jpg
#
# Run this once per environment (idempotent: uses x-upsert).
#
# Usage:
#   eval "$(python3 /tmp/opencode/envload.py .env)"   # load SUPABASE_* from .env
#   ./infra/seed-images/upload.sh
set -euo pipefail

: "${SUPABASE_URL:?SUPABASE_URL is required}"
: "${SUPABASE_STORAGE_BUCKET:?SUPABASE_STORAGE_BUCKET is required}"
: "${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is required}"

BASE="${SUPABASE_URL%/}"
DIR="$(cd "$(dirname "$0")" && pwd)"

for img in "$DIR"/*.jpg; do
  name="$(basename "$img")"
  code=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "${BASE}/storage/v1/object/${SUPABASE_STORAGE_BUCKET}/products/seed-${name}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: image/jpeg" \
    -H "x-upsert: true" \
    --data-binary @"$img")
  echo "seed-${name} -> HTTP ${code}"
done

echo "Done. Public URLs: ${BASE}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/products/seed-<slug>.jpg"
