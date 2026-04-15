# Project Structure

This document explains the organization and purpose of each directory and key file in Jisho2Anki.

## Directory Overview

```
Jisho2Anki/
├── autofiller/              # Core Python package
├── frontend/                # React UI (SPA)
├── scripts/                 # Utility and automation scripts
├── templates/               # HTML templates for web server
├── tests/                   # Unit tests
├── presets/                 # Example environment presets
├── output/                  # TSV output (generated, gitignored)
├── .github/                 # GitHub-specific configuration
├── Dockerfile               # Container image definition
├── docker-compose.yml       # Production compose config
├── docker-compose.dev.yml   # Development compose config
├── docker-compose.windows.yml # Windows-specific overrides
├── Makefile                 # Convenience build and run targets
├── requirements.txt         # Python dependencies
├── README.md                # Main documentation
├── CHANGELOG.md             # Release history
├── CONTRIBUTING.md          # Developer guidelines
├── TROUBLESHOOTING.md       # Common issues and solutions
├── PROJECT_STRUCTURE.md     # This file
├── WINDOWS_DEV.md           # Windows-specific setup guide
└── RELEASE_STANDARDS.md     # Release quality requirements
```

## Core Modules

### `autofiller/` - Main Python Package

**Purpose:** All core business logic, APIs, and configuration.

#### Key Files

- **`__init__.py`** - Package metadata, version marker
  - Exports: `__version__`

- **`cli.py`** - Command-line interface
  - Entry point: `python -m autofiller.cli`
  - Handles file I/O, argument parsing
  - Usage: `python -m autofiller.cli --input words.txt --output anki_import.tsv`

- **`web_app.py`** - Flask web server and REST API
  - Entry point: `python -m autofiller.web_app`
  - Hosts: Static frontend assets + JSON API endpoints
  - Key endpoints:
    - `GET /healthz` - Health check
    - `POST /api/batch` - Generate cards from word list
    - `GET /api/bootstrap` - UI initialization data (presets, defaults)

- **`pipeline.py`** - Core batch processing pipeline
  - `build_rows()` - Orchestrates lookup → enrichment → formatting
  - `build_word_result()` - Produces Anki card rows from a single word
  - Handles parallel/sequential modes and interactive selection

- **`config.py`** - Configuration management
  - `Config` class: Loads and validates settings
  - Environment variable parsing
  - Preset file resolution
  - Merges: defaults → env vars → presets

- **`jisho_client.py`** - Jisho.org API client
  - `JishoClient` class: HTTP wrapper around Jisho API
  - Methods: `search()`, `search_kanji()`
  - Handles: Retries, User-Agent, timeouts

- **`anki_connect_client.py`** - AnkiConnect integration
  - `AnkiConnectClient` class: RPC client for desktop Anki
  - Methods: `add_note()`, `find_notes()`, `store_file()`
  - Default: localhost:8765, configurable via env

- **`pitch_accent.py`** - Pitch accent data reading
  - `PitchAccentReader` class
  - Reads from Anki pitch accent add-on directory
  - Returns: SVG data and reading strings

- **`models.py`** - Data structures
  - Dataclasses: `Config`, `WordResult`, `SentenceCardRow`, etc.
  - Type-safe representations of cards and settings

- **`io_utils.py`** - File I/O utilities
  - TSV read/write helpers
  - Handles both file paths and stdout

### `frontend/` - React Vite SPA

**Purpose:** User interface for the web mode.

#### Structure

```
frontend/
├── src/
│   ├── App.jsx              # Main React component
│   ├── main.jsx             # Entry point (Vite)
│   └── styles.css           # Global styles
├── public/                  # Static assets (if any)
├── vite.config.js           # Vite build config
├── package.json             # Node dependencies
└── dist/                    # Built output (generated)
```

**Key Points:**
- Built with `npm run build` → outputs to `dist/`
- Flask serves from `static/` (symlinked to `dist/` in Docker)
- Dev mode: `npm run dev` (Vite dev server on :3000)
- Build mode: Static files embedded in Flask app

### `scripts/` - Utility Scripts

**Purpose:** Automation, Docker orchestration, and development helpers.

#### Key Files

- **`docker-up.sh`** - Start Docker stack
  - Pulls prebuilt image or builds locally
  - Creates .env.docker if missing
  - Applies Windows overrides automatically on Windows

- **`docker-down.sh`** - Stop and remove containers

- **`docker-logs.sh`** - Stream container logs

- **`docker_wrapper.py`** - Cross-platform Docker control
  - Handles OS detection (Windows vs Linux/Mac)
  - Manages compose arguments and environment variables
  - Commands: `up`, `build-dev`, `healthz`

- **`dev.py`** - Local dev runner
  - Runs Flask + Vite dev server in parallel
  - Live frontend reload + fast iteration

- **`backup-output.sh`** - Timestamped TSV backup utility

### `templates/` - Server Templates

**Purpose:** HTML served by Flask.

- **`spa.html`** - Single-page app container
  - Loads React bundle from `static/`
  - API requests go to Flask backend

### `tests/` - Unit Tests

**Purpose:** Test coverage for core logic.

#### Test Files

- **`test_config_loading.py`** - Config parsing and validation
  - Environment variable precedence
  - Preset file resolution
  - Type coercion

- **`test_pipeline_behavior.py`** - Pipeline and word result generation
  - Card row building
  - Sentence card mode
  - Pitch accent inclusion
  - Interactive selection

- **`test_web_api_endpoints.py`** - Flask route handlers
  - /healthz, /api/bootstrap, /api/batch
  - (Skipped if Flask not installed; use `make test-docker`)

- **`test_web_checkbox_settings.py`** - UI settings encoding
  - Checkbox state serialization

**Run tests:**
```bash
make test              # Local tests
make test-docker       # Tests in running container
```

### `presets/` - Environment Presets

**Purpose:** Example .env configurations for different use cases.

#### Files

- `safe-api.env` - Conservative API limits
- `balanced.env` - Default recommended settings
- `high-quality.env` - Enhanced quality (slower)
- `sentence-cards.env` - Emphasis on example sentences
- `turbo-import.env` - Speed optimized
- `tsv-only.env` - Skip Anki integration

**Usage:**
```bash
ANKI_JISHO2ANKI_PRESET=high-quality python -m autofiller.cli ...
```

## Configuration

### Environment Variables

**Key variables** (see `autofiller/config.py` for full list):

| Variable | Purpose | Default |
|----------|---------|---------|
| `ANKI_JISHO2ANKI_OUTPUT_PATH` | TSV output file | `output/anki_import.tsv` |
| `ANKI_JISHO2ANKI_ANKI_URL` | AnkiConnect endpoint | `http://127.0.0.1:8765` (Linux) / `host.docker.internal:8765` (Windows) |
| `ANKI_JISHO2ANKI_PRESET` | Preset name | (empty, use defaults) |
| `ANKI_PITCH_ADDON_DIR` | Pitch accent addon path | `$HOME/.local/share/Anki2/addons21/148002038` (Linux) / `$APPDATA/Anki2/addons21/148002038` (Windows) |

### Environment Files

- **`.env.docker.example`** - Template for Docker configuration
  - Copy to `.env.docker` to use
  - Includes: port, image tag, preset, API URLs

- **`.env.example`** - Template for local Python environment
  - For native Python mode (non-Docker)

## Docker Configuration

### Multi-File Compose Strategy

The project uses **compose file merging** for cross-platform support:

```bash
# Linux: uses base only
docker-compose -f docker-compose.yml ...

# Windows: merges base + override
docker-compose -f docker-compose.yml -f docker-compose.windows.yml ...
```

#### Files

- **`Dockerfile`** - Container image definition
  - Base: `python:3.12-slim`
  - User: `appuser` (UID 10001) on Linux, root on Windows
  - Ports: 5000 (Flask)
  - Health check: `/healthz` endpoint

- **`docker-compose.yml`** - Production configuration
  - Linux-specific settings (UID/GID user, Linux addon paths)
  - Base for all platforms

- **`docker-compose.dev.yml`** - Development configuration
  - Mounts code directly for fast iteration
  - Disables health checks (optional)

- **`docker-compose.windows.yml`** - Windows overrides
  - User: root (required for volume writes on Windows)
  - Addon path: Windows %APPDATA%
  - AnkiConnect URL: host.docker.internal

## Build and Deployment

### Makefile Targets

**Development:**
- `make up` - Start Docker stack
- `make down` - Stop stack
- `make logs` - Stream logs
- `make ps` - Container status
- `make test` - Run local unit tests
- `make test-docker` - Run tests in container

**Building:**
- `make build-dev` - Build dev image locally
- `make dev-up` - Start dev compose stack

**Release:**
- `make release-check` - Validate release prerequisites
- `make smoke` - Health check + API endpoint verification

**Utilities:**
- `make backup` - Backup output TSV
- `make config` - Display resolved compose config

### CI/CD Workflows

Located in `.github/workflows/`:

- **`tests.yml`** - Run unit tests on push/PR
- **`compose-smoke.yml`** - Docker stack health checks
- **`docker-release.yml`** - Build and push container image (on tag)

## Key Concepts

### Data Flow

```
Input (words.txt)
    ↓
Pipeline.build_rows()
    ↓
For each word:
  - JishoClient.search()           [API call]
  - Pipeline.build_word_result()   [Enrichment]
  - PitchAccentReader (if enabled) [Pitch data]
    ↓
Anki.add_note() or TSV.write()     [Output]
```

### Settings Precedence

```
Defaults (hardcoded)
    ↓ overridden by
Environment Variables (.env files)
    ↓ overridden by
Preset Files (presets/*.env)
    ↓ overridden by (web UI only)
User Selections (UI state bag)
```

### Container Entry Points

```
docker-compose up
    ↓
Dockerfile CMD
    ↓
python -m autofiller.web_app
    ↓
Flask runs on :5000
```

## Contributing Areas

**Backend (Python):**
- `autofiller/jisho_client.py` - Extend API capabilities
- `autofiller/pipeline.py` - Add processing modes
- `autofiller/config.py` - New configuration options

**Frontend (React):**
- `frontend/src/App.jsx` - UI components
- `frontend/src/styles.css` - Styling

**Testing:**
- `tests/` - Add test coverage

**Documentation:**
- README.md, CONTRIBUTING.md, TROUBLESHOOTING.md - Improve guides

**CI/CD:**
- `.github/workflows/` - Improve automation

---

**Questions?** See [CONTRIBUTING.md](CONTRIBUTING.md) or open an issue!
