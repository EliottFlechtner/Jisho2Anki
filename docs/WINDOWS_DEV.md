# Windows Dev Notes

This guide explains how to run Jisho2Anki on Windows, including both Docker and non-Docker paths.

## Prerequisites To Install

1. Git for Windows
2. Python 3.12 (enable "Add python.exe to PATH" during install)
3. Node.js 20 LTS (required for web frontend build/dev)
4. Desktop Anki + AnkiConnect add-on (code: `2055492159`) if you want direct add-to-Anki
5. Optional: Docker Desktop for Windows (if you want container mode)

## Option A: Windows + Docker Desktop

1. Open PowerShell in the repository root.
2. Copy compose env file:

```powershell
Copy-Item .env.docker.example .env.docker
```

3. Start container stack:

```powershell
docker compose up -d
```

4. Check status and logs:

```powershell
docker compose ps
docker compose logs -f
```

5. Open the app at `http://127.0.0.1:5000` (or your configured `APP_PORT`).

6. Stop the stack when done:

```powershell
docker compose down
```

### Using Make Commands on Windows

If you have `make` installed, you can use the convenience targets from the Makefile. Otherwise, use the explicit commands below.

#### Option A.1: With Make Installed

Install Make first:

- **Using Chocolatey** (recommended):
  ```powershell
  choco install make
  ```

- **Using Scoop**:
  ```powershell
  scoop install make
  ```

- **Using WSL2** (Windows Subsystem for Linux):
  ```bash
  # Inside WSL2 Ubuntu/Debian
  sudo apt-get install make
  ```

Then use make targets:

```powershell
make up              # Start production containers
make down            # Stop containers
make ps              # Show container status
make logs            # Follow logs
make build-dev       # Build dev image with BUILDKIT (fixes DNS issues)
make build-dev-up    # Build dev image and start dev stack
make dev-up          # Start dev stack (uses pre-built image)
make test            # Run local tests
make test-docker     # Run tests in container
make help            # Show all targets
```

#### Option A.2: Without Make (Direct Docker Commands)

```powershell
# Start production stack
docker compose --env-file .env.docker up -d

# Start development stack
docker compose -f docker-compose.dev.yml up

# Build dev image (with BUILDKIT for DNS fixes)
$env:DOCKER_BUILDKIT=1; docker build --network=host -t jisho2anki:dev .

# Stop containers
docker compose down
```

Notes:

- This avoids Linux-only helpers such as `./scripts/docker-up.sh` (which won't work on Windows).
- `host.docker.internal` works on Docker Desktop, so desktop AnkiConnect is reachable from the container.
- Dev image build with BUILDKIT (`--network=host`) fixes DNS resolution issues during package installation.

## Option B: Native Windows (No Docker)

1. Open PowerShell in the repository root.
2. Create and activate virtual environment:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Install Python dependencies:

```powershell
python -m pip install -r requirements.txt
```

4. Install frontend dependencies once:

```powershell
cd frontend
npm install
cd ..
```

5. Choose one runtime mode:

- Static web UI mode:

```powershell
cd frontend
npm run build
cd ..
python -m autofiller.web_app
```

- Frontend live-reload dev mode:

```powershell
python scripts/dev.py
```

- CLI-only mode:

```powershell
python -m autofiller.cli --input words.txt --output anki_import.tsv --include-header
```

## Windows Troubleshooting

- If PowerShell blocks activation scripts, run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

- If `py` is missing, reinstall Python and ensure PATH integration is enabled.
- Keep desktop Anki open while using `--anki-connect`.
