#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p output

docker compose up -d --build "$@"
echo "Anki Autofiller is starting at http://127.0.0.1:${APP_PORT:-5000}"
