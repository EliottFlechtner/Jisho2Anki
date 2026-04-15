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

Notes:

- This avoids Linux-only helpers such as `make up` and `./scripts/docker-up.sh`.
- `host.docker.internal` works on Docker Desktop, so desktop AnkiConnect is reachable from the container.

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
python web_app.py
```

- Frontend live-reload dev mode:

```powershell
python scripts/dev.py
```

- CLI-only mode:

```powershell
python jisho2anki.py --input words.txt --output anki_import.tsv --include-header
```

## Windows Troubleshooting

- If PowerShell blocks activation scripts, run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

- If `py` is missing, reinstall Python and ensure PATH integration is enabled.
- Keep desktop Anki open while using `--anki-connect`.
