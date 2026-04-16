#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(dirname "$0")/.."
cd "$ROOT_DIR"
mkdir -p output

if [[ ! -f .env.docker && -f .env.docker.example ]]; then
	cp .env.docker.example .env.docker
	echo "Created .env.docker from .env.docker.example"
fi

COMPOSE_ARGS=()
if [[ -f .env.docker ]]; then
	COMPOSE_ARGS+=(--env-file .env.docker)
fi

LINUX_HOST_NETWORK="${ANKI_JISHO2ANKI_LINUX_HOST_NETWORK:-}"
if [[ -z "$LINUX_HOST_NETWORK" && -f .env.docker ]]; then
	LINUX_HOST_NETWORK="$(grep -E '^ANKI_JISHO2ANKI_LINUX_HOST_NETWORK=' .env.docker | tail -n1 | cut -d'=' -f2- | tr -d '"' | tr -d "'" | tr -d '[:space:]')"
fi

# Add Windows-specific overrides if on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
	COMPOSE_ARGS+=(-f config/docker-compose.yml -f config/docker-compose.windows.yml)
elif [[ "$OSTYPE" == linux-gnu* && "$LINUX_HOST_NETWORK" =~ ^(1|true|yes|on)$ ]]; then
	COMPOSE_ARGS+=(-f config/docker-compose.yml -f config/docker-compose.linux-host.yml)
else
	COMPOSE_ARGS+=(-f config/docker-compose.yml)
fi

echo "Attempting to pull prebuilt image..."
docker compose "${COMPOSE_ARGS[@]}" pull --ignore-pull-failures "$@" >/dev/null 2>&1 || true

if docker compose "${COMPOSE_ARGS[@]}" up -d --no-build "$@"; then
	echo "Jisho2Anki is starting at http://127.0.0.1:${APP_PORT:-5000}"
	exit 0
fi

echo "No runnable image was found locally. Building image now..."
if ! docker compose "${COMPOSE_ARGS[@]}" build "$@"; then
	echo
	echo "Build failed. This is usually a host Docker DNS/connectivity problem."
	echo "Try:"
	echo "  1) docker run --rm busybox nslookup pypi.org"
	echo "  2) Restart Docker daemon"
	echo "  3) If behind proxy, set HTTP_PROXY/HTTPS_PROXY/NO_PROXY and retry"
	echo "  4) Optionally set PIP_INDEX_URL in .env.docker"
	exit 1
fi

docker compose "${COMPOSE_ARGS[@]}" up -d "$@"
echo "Jisho2Anki is starting at http://127.0.0.1:${APP_PORT:-5000}"
