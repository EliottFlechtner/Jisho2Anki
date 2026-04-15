# Troubleshooting Guide

This guide covers common issues and their solutions.

## General Setup

### "Python not found" or "command not found"

**On Windows:**
- Ensure Python 3.12+ is installed and in PATH
- Try `py --version` instead of `python --version`
- Install from python.org with "Add python.exe to PATH" enabled

**On Linux/Mac:**
- Use `python3` instead of `python`
- Check: `which python3`

### "pip: command not found"

```bash
# Install pip
python -m ensurepip --default-pip

# Or upgrade it
python -m pip install --upgrade pip
```

### Venv not activating

**Windows (PowerShell):**
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
.\.venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**
```cmd
.venv\Scripts\activate.bat
```

**Linux/Mac:**
```bash
source .venv/bin/activate
```

## Docker Issues

### Docker daemon not running

**Error:** `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`

**Solution:**
1. Launch Docker Desktop from Start Menu
2. Wait for it to show "Docker Desktop is running" in system tray
3. Try your command again

### "Permission denied: /app/output/anki_import.tsv" (Windows)

**Cause:** Old TSV file has restrictive permissions from mismatched user

**Solution:**
```powershell
Remove-Item output\anki_import.tsv -Force
make down
make up
```

Or completely clear and restart:
```powershell
docker compose --env-file .env.docker down
docker volume prune
make up
```

### Docker build DNS failures

**Error:** `failed to resolve pypi.org` or similar during build

**Solutions (in order):**

1. **Restart Docker daemon:**
   - Windows: Docker Desktop > Settings > Resources > Restart
   - Linux: `sudo systemctl restart docker`

2. **Check network connectivity:**
   ```bash
   docker run --rm busybox nslookup pypi.org
   ```

3. **Behind a proxy?** Update `.env.docker`:
   ```env
   HTTP_PROXY=http://proxy.example.com:8080
   HTTPS_PROXY=http://proxy.example.com:8080
   NO_PROXY=localhost,127.0.0.1
   ```

4. **Set pip index explicitly:**
   ```env
   PIP_INDEX_URL=https://pypi.org/simple
   ```

### "make: *** [Makefile:XX: up] Error 1"

**On Windows:**
- Verify Make is installed: `make --version`
- If using WSL/Git Bash, use PowerShell instead
- Check Python is accessible: `python --version`

**On Linux/Mac:**
- Check Bash is available: `which bash`
- File permissions: `chmod +x scripts/*.sh`

### Docker compose file not found

**Error:** `no such file or directory` in docker-compose

**Solution:**
```bash
# Verify files exist
ls docker-compose.yml docker-compose.windows.yml  # Windows
ls docker-compose.yml docker-compose.dev.yml      # Linux (no Windows override)

# Make sure you're in correct directory
pwd  # Should show Jisho2Anki repo root
```

## AnkiConnect Issues

### "Could not reach AnkiConnect at http://127.0.0.1:8765"

**Cause:** Anki not running or AnkiConnect add-on not installed/enabled

**Solutions:**

1. **Launch Desktop Anki** on your machine
2. **Install AnkiConnect add-on:**
   - In Anki: Tools → Add-ons → Get Add-ons
   - Paste code: `2055492159`
   - Restart Anki
3. **Verify localhost access:**
   ```bash
   curl http://127.0.0.1:8765
   # Should return: curl: (52) Empty reply from server (OK from AnkiConnect perspective)
   ```

**For Windows Docker users specifically:**
- Container uses `host.docker.internal:8765` (set in `.env.docker` override)
- Desktop Anki must be listening on all addresses or localhost
- Verify Anki is running on the host machine, not in WSL

### Anki notes not syncing

**In web UI, add button does nothing:**

1. Check Anki is running and AnkiConnect responding
2. Check .env.docker has correct `ANKI_URL`:
   ```bash
   cat .env.docker | grep ANKI_URL
   # Windows: http://host.docker.internal:8765
   # Linux: http://127.0.0.1:8765
   ```
3. Restart container:
   ```bash
   make down
   make up
   ```
4. Check Anki add-on logs for errors

## Pitch Accent Issues

### "Pitch accent data missing" or blank reading field after import

**Cause:** Anki pitch accent add-on not found or not installed on host

**Solutions:**

1. **Install Anki pitch accent add-on:**
   - In Anki: Tools → Add-ons → Get Add-ons
   - Search: "Anki Quick Academic Pitch"
   - Install and restart Anki

2. **On Windows, verify path in `.env.docker`:**
   ```env
   # Should not need editing, but check:
   ANKI_PITCH_ADDON_DIR=  # Will be set by docker-compose.windows.yml override
   ```
   
3. **On Linux, verify path:**
   ```bash
   ls ~/.local/share/Anki2/addons21/148002038/
   # Should contain pitch accent files
   ```

4. **Clear cache and rebuild:**
   ```bash
   make down
   rm output/anki_import.tsv
   make up
   ```

## Frontend Issues (Web UI)

### Styles not loading / UI looks broken

**Cause:** Frontend assets not built

**Solutions:**

1. **Static build mode:**
   ```bash
   cd frontend
   npm run build
   cd ..
   python -m autofiller.web_app
   ```
   Then open: `http://127.0.0.1:5000`

2. **Live dev mode:**
   ```bash
   python scripts/dev.py
   ```
   Then open: `http://127.0.0.1:3000` (Vite dev server)

### "Cannot find module" errors in frontend

**Solution:**
```bash
cd frontend
npm install  # Re-install dependencies
npm cache clean --force
npm run build
cd ..
```

### Browser console shows 404 errors

**Check:**
1. Web app is running: `make ps`
2. No CORS issues in browser console
3. `.env.docker` has correct API URL

## Test Issues

### "ModuleNotFoundError: No module named 'flask'"

**Cause:** Flask dependency not installed (for web tests)

**Solution:**
```bash
pip install -r requirements.txt
# Or if in Docker:
make test-docker
```

### Tests hang or timeout

```bash
# Kill hanging tests
Ctrl+C  # Or send SIGTERM

# Check what's running
make ps

# Force cleanup
make down
```

## File Permission Issues (Linux)

### "Permission denied" on output files

**Cause:** Files created with different user (Docker running as appuser)

**Solution:**
```bash
# Fix permissions on output directory
sudo chown -R $USER:$USER output/

# Or allow Docker to write with user mapping
# Set UID/GID in .env.docker
```

## Performance Issues

### Docker startup is very slow

**On Windows:**
- WSL2 backend recommended over Hyper-V
- Docker Desktop Settings → Resources → increase CPU/Memory allocation
- Check disk space: `docker system df`

### Container health checks failing ("Unhealthy" status)

```bash
# View detailed logs
make logs

# Wait longer before health check
# Edit Dockerfile healthcheck timeout if needed

# Restart once fully healthy
make down
make up
# Wait ~20 seconds before accessing app
```

## "HOME variable is not set" (Windows Docker)

This is a **non-critical warning**. It appears because Windows doesn't export the `HOME` environment variable to Docker.

**If it causes issues:**
```env
# In .env.docker, explicitly set:
HOME=/home/appuser  # Docker internal home, not used for addon detection
```

The pitch addon path uses `$APPDATA` on Windows and `$HOME` on Linux, so this warning is harmless.

## General Debugging

### Enable verbose logging

**For web app:**
```bash
export FLASK_DEBUG=1
python -m autofiller.web_app
```

**For Docker:**
```bash
docker compose -f docker-compose.yml logs -f --tail=50
```

### Check environment variables in container

```bash
docker compose exec jisho2anki env | grep ANKI
# Should show ANKI_URL, ANKI_PITCH_ADDON_DIR, etc.
```

### Reset everything

```bash
# Nuclear option - safe to run:
make down
rm -rf output/*.tsv
docker system prune -a  # WARNING: deletes all unused Docker images
docker volume prune      # WARNING: deletes unused volumes
make up
```

## Still Stuck?

1. **Check existing issues:** https://github.com/EliottFlechtner/Jisho2Anki/issues
2. **Open a new issue with:**
   - OS and version
   - Python version (`python --version`)
   - Docker version (`docker --version`)
   - Relevant output from `make logs`
   - Steps to reproduce
3. **Emergency: Start fresh**
   ```bash
   git status              # Confirm clean working tree
   rm -rf .venv output
   git pull origin main
   python -m venv .venv
   # Re-activate and re-setup
   ```

---

**Last updated:** v1.0.1
