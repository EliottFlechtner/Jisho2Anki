# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-04-15

### Added
- **Windows Docker support**: Full Docker Desktop compatibility without WSL/bash requirement
- `docker-compose.windows.yml` override for Windows-specific settings (user, AnkiConnect URL, addon paths)
- `scripts/docker_wrapper.py`: Cross-platform Python wrapper for consistent Docker Compose control
- Updated `WINDOWS_DEV.md` with verified setup instructions
- `contrib/CONTRIBUTING.md`, `TROUBLESHOOTING.md`, `PROJECT_STRUCTURE.md` for developer onboarding

### Changed
- Refactored Makefile to use Python instead of shell scripts for true cross-platform compatibility
- `.env.docker` now uses Linux defaults; Windows overrides applied via compose file
- `scripts/docker-up.sh` now detects Windows and applies appropriate overrides
- Pitched accent addon path handling: Linux (`${HOME}/.local/share/Anki2/addons21/...`), Windows (`${APPDATA}/Anki2/addons21/...`)
- AnkiConnect URL: Linux uses `127.0.0.1:8765`, Windows/Mac use `host.docker.internal:8765`

### Fixed
- Permission denied errors on Windows when writing to `/app/output/anki_import.tsv` (now runs as root on Windows)
- Docker build-dev target now skips incompatible `DOCKER_BUILDKIT` and `--network=host` flags on Windows
- `make` commands now work natively on Windows without bash/MinGW

### Tested
- All make commands verified on Windows: `make up/down/logs/ps/config/release-check/backup/test`
- Docker health checks working on Windows
- GitHub Actions CI/CD smoke tests passing on Linux
- Cross-platform compatibility maintained

## [1.0.0] - 2026-04-15

### Added
- Initial stable v1.0.0 release marker in the Python package (`autofiller.__version__`).
- In-code documentation pass across core runtime modules.

### Changed
- Updated Jisho HTTP User-Agent to use package version dynamically.
- Updated README release/tag examples for v1.x and linked changelog usage.

### Notes
- This release is intended to be the first stable cross-platform (Linux + Windows) baseline.
