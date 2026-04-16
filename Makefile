.PHONY: help up down logs ps config dev-up build-dev build-dev-up release-check smoke backup test test-docker

PYTHON ?= $(shell if command -v python3 >/dev/null 2>&1; then echo python3; elif command -v python >/dev/null 2>&1; then echo python; elif command -v py >/dev/null 2>&1; then echo "py -3"; else echo python3; fi)

help:
	@echo "Targets:"
	@echo "  make up            - Build and start Docker stack"
	@echo "  make down          - Stop Docker stack"
	@echo "  make logs          - Follow service logs"
	@echo "  make ps            - Show container status"
	@echo "  make config        - Render compose config"
	@echo "  make dev-up        - Start dev compose stack (uses pre-built image)"
	@echo "  make build-dev     - Build local dev image with BUILDKIT (fixes DNS issues)"
	@echo "  make build-dev-up  - Build dev image and start with compose"
	@echo "  make release-check - Validate release prerequisites"
	@echo "  make smoke         - Start stack and validate core endpoints"
	@echo "  make backup        - Create timestamped backup of output TSV"
	@echo "  make test          - Run local regression tests"
	@echo "  make test-docker   - Run tests inside running Docker container"

_ensure_env:
	@$(PYTHON) -c "import os, shutil; os.path.exists('.env.docker') or (os.path.exists('config/.env.docker.example') and shutil.copy('config/.env.docker.example', '.env.docker')) or None"

up: _ensure_env
	@$(PYTHON) scripts/docker_wrapper.py up

down:
	docker compose -f config/docker-compose.yml --env-file .env.docker down

logs:
	docker compose -f config/docker-compose.yml --env-file .env.docker logs -f

ps:
	docker compose -f config/docker-compose.yml --env-file .env.docker ps

config:
	docker compose --env-file .env.docker config

dev-up:
	docker compose -f docker-compose.dev.yml up

build-dev:
	@$(PYTHON) scripts/docker_wrapper.py build-dev

build-dev-up: build-dev
	docker compose -f docker-compose.dev.yml up

release-check:
	@$(PYTHON) -c "import os, shutil; os.path.exists('.env.docker') or (os.path.exists('.env.docker.example') and shutil.copy('.env.docker.example', '.env.docker')) or None"
	@$(PYTHON) -c "import subprocess; subprocess.run(['docker', 'compose', '--env-file', '.env.docker', 'config'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)"
	@echo "Release check OK"

smoke: up
	@$(PYTHON) scripts/docker_wrapper.py healthz

backup:
	@$(PYTHON) -c "import shutil, os; (os.path.exists('output/anki_import.tsv') and (shutil.copy('output/anki_import.tsv', 'output/anki_import.tsv.bak'), print('Backed up to output/anki_import.tsv.bak'))) or (not os.path.exists('output/anki_import.tsv') and print('No TSV file to backup'))"

test:
	$(PYTHON) -m unittest discover -s tests -p "test_*.py" -v

test-docker:
	docker exec jisho2anki python -m unittest discover -s tests -p "test_*.py" -v
