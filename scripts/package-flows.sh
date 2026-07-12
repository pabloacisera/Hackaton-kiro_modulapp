#!/usr/bin/env bash
set -euo pipefail

# Packages the flows/ directory into a zip and optionally uploads to Google Drive
# using the Google Drive API v3 directly via curl. No external CLI tools needed.
#
# Usage:
#   ./scripts/package-flows.sh              # zip only
#   ./scripts/package-flows.sh --upload     # zip + upload to Google Drive
#
# Environment variables for upload (set in .env):
#   GOOGLE_ACCESS_TOKEN    — Short-lived access token (fastest, manual)
#   GOOGLE_CLIENT_ID       — OAuth2 client ID  \
#   GOOGLE_CLIENT_SECRET   — OAuth2 client secret  > auto-refresh token
#   GOOGLE_REFRESH_TOKEN   — OAuth2 refresh token  /
#   GDRIVE_FOLDER_ID       — Target folder ID (optional, uploads to root if empty)
#
# How to get credentials:
#   1. Go to https://console.cloud.google.com/apis/credentials
#   2. Create OAuth 2.0 Client ID (Desktop app)
#   3. Enable Google Drive API in the project
#   4. Get a refresh token via OAuth Playground: https://developers.google.com/oauthplayground/
#      - Select "Google Drive API v3" scopes
#      - Exchange authorization code for tokens
#      - Copy the refresh_token

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
FLOWS_DIR="$ROOT_DIR/flows"
OUTPUT_DIR="$ROOT_DIR"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
ZIP_NAME="flows-${TIMESTAMP}.zip"
ZIP_PATH="$OUTPUT_DIR/$ZIP_NAME"

# Load .env if present
if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

UPLOAD=false
if [[ "${1:-}" == "--upload" ]]; then
  UPLOAD=true
fi

if [ ! -d "$FLOWS_DIR" ]; then
  echo "Error: flows/ directory not found at $FLOWS_DIR"
  exit 1
fi

FILE_COUNT=$(find "$FLOWS_DIR" -type f | wc -l)
if [ "$FILE_COUNT" -eq 0 ]; then
  echo "Error: flows/ directory is empty"
  exit 1
fi

echo "Packaging flows/ ($FILE_COUNT files)..."

cd "$ROOT_DIR"
zip -r "$ZIP_PATH" flows/ -x "flows/.gitkeep" "flows/**/__pycache__/*"

echo "Created: $ZIP_PATH ($(du -h "$ZIP_PATH" | cut -f1))"

if [ "$UPLOAD" = true ]; then
  # Resolve access token
  ACCESS_TOKEN="${GOOGLE_ACCESS_TOKEN:-}"

  if [ -z "$ACCESS_TOKEN" ] && [ -n "${GOOGLE_CLIENT_ID:-}" ] && [ -n "${GOOGLE_REFRESH_TOKEN:-}" ]; then
    echo "Refreshing access token..."
    TOKEN_RESPONSE=$(curl -s -X POST "https://oauth2.googleapis.com/token" \
      -d "client_id=${GOOGLE_CLIENT_ID}" \
      -d "client_secret=${GOOGLE_CLIENT_SECRET:-}" \
      -d "refresh_token=${GOOGLE_REFRESH_TOKEN}" \
      -d "grant_type=refresh_token")
    ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || true)
  fi

  if [ -z "$ACCESS_TOKEN" ]; then
    echo "Error: No Google credentials found."
    echo ""
    echo "Set one of these in your .env file:"
    echo "  GOOGLE_ACCESS_TOKEN=<token>        (quick: get from OAuth Playground)"
    echo "  GOOGLE_CLIENT_ID=<id>              \\"
    echo "  GOOGLE_CLIENT_SECRET=<secret>       > auto-refresh"
    echo "  GOOGLE_REFRESH_TOKEN=<token>       /"
    echo ""
    echo "Get credentials at: https://console.cloud.google.com/apis/credentials"
    echo "Get refresh token at: https://developers.google.com/oauthplayground/"
    rm -f "$ZIP_PATH"
    exit 1
  fi

  # Build metadata JSON
  FILENAME=$(basename "$ZIP_PATH")
  METADATA="{\"name\": \"${FILENAME}\""
  if [ -n "${GDRIVE_FOLDER_ID:-}" ]; then
    METADATA="${METADATA}, \"parents\": [\"${GDRIVE_FOLDER_ID}\"]"
  fi
  METADATA="${METADATA}}"

  echo "Uploading to Google Drive..."

  RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart" \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -F "metadata=${METADATA}; type=application/json; charset=UTF-8" \
    -F "file=@${ZIP_PATH}; type=application/zip")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "200" ]; then
    FILE_ID=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "unknown")
    echo "Uploaded: https://drive.google.com/file/d/${FILE_ID}/view"
  else
    echo "Error uploading (HTTP $HTTP_CODE):"
    echo "$BODY"
    rm -f "$ZIP_PATH"
    exit 1
  fi

  rm -f "$ZIP_PATH"
fi
