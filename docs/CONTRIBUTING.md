# Contributing to Jisho2Anki

Thank you for your interest in contributing! This document provides guidelines for contributing to Jisho2Anki.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## Getting Started

### Prerequisites

- **Python 3.12+** with pip and venv
- **Node.js 20 LTS** (for frontend work)
- **Docker Desktop** (optional, for testing containerized setup)
- **Make** (optional, for convenience targets)
- **Git** for version control

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/EliottFlechtner/Jisho2Anki.git
   cd Jisho2Anki
   ```

2. **Set up Python environment:**
   ```bash
   python -m venv .venv
   # On Windows:
   .\.venv\Scripts\Activate.ps1
   # On Linux/Mac:
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **For frontend work, install Node dependencies:**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Run tests locally:**
   ```bash
   make test
   # Or directly:
   python -m unittest discover -s tests -p "test_*.py" -v
   ```

### Development Modes

**CLI mode (fastest for backend work):**
```bash
python -m autofiller.cli --input words.txt --output output.tsv --include-header
```

**Web UI with live frontend reload:**
```bash
python scripts/dev.py
```

**Docker setup (test full stack):**
```bash
make up
# Access at http://127.0.0.1:5000
make down
```

## Making Changes

### Branch Naming

- `feature/your-feature-name` for new features
- `fix/issue-description` for bug fixes
- `docs/description` for documentation
- `refactor/description` for code improvements

### Coding Standards

1. **Follow Google-style docstrings** (see [RELEASE_STANDARDS.md](RELEASE_STANDARDS.md))
2. **Use type hints** where practical
3. **Write tests** for new functionality
4. **Keep commits atomic** - one logical change per commit
5. **Run tests before pushing:**
   ```bash
   make test
   ```

### Platform Compatibility

**Jisho2Anki supports Windows, Linux, and macOS.** When contributing:

- Test on **both Windows and Linux** if possible
- Use cross-platform Python code (avoid bash scripts in Makefile)
- Check Windows paths use `\` properly or use `pathlib.Path`
- Test Docker setup on both platforms:
  ```bash
  make up
  make smoke  # Runs health checks
  make down
  ```

**Known platform considerations:**
- Windows: Use `docker-compose.windows.yml` override automatically
- Docker Desktop required; WSL2 backend recommended
- Python wrapper (`scripts/docker_wrapper.py`) handles OS detection

### Directory Structure Context

Before making changes, understand the project layout (see [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)):

- `autofiller/` - Core Python modules (Jisho API, pipeline, config)
- `frontend/` - React + Vite SPA
- `scripts/` - Utility and build scripts
- `tests/` - Unit tests
- `templates/` - HTML templates for web UI
- `presets/` - Example environment presets

## Testing

### Running Tests Locally

```bash
# All tests
make test

# Specific test module
python -m unittest tests.test_config_loading

# Frontend end-to-end tests (Playwright)
cd frontend
npx playwright install chromium
npm run test:e2e

# Tests in Docker
make test-docker  # (requires running container)
```

### Writing Tests

- Place tests in `tests/test_*.py`
- Use standard `unittest` framework
- Include docstrings describing what is tested
- Example:
  ```python
  def test_example_feature(self):
      """Feature description should verify expected behavior."""
      result = some_function(input_value)
      self.assertEqual(result, expected_value)
  ```

## Submitting Changes

1. **Create a branch:**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make your changes** and test thoroughly

3. **Update documentation:**
   - Add docstrings to new functions
   - Update README.md if adding user-facing features
   - Update CHANGELOG.md in the `[Unreleased]` section

4. **Commit with clear messages:**
   ```bash
   git commit -m "feat: add new vocabulary batch feature

   - Added batch import endpoint
   - Handles duplicate detection
   - Includes integration tests"
   ```

5. **Push and open a Pull Request:**
   ```bash
   git push origin feature/your-feature
   ```

6. **Reference any related issues:**
   ```
   Closes #123
   Related to #456
   ```

### PR Checklist

- [ ] Tests pass locally (`make test`)
- [ ] Code follows project style guidelines
- [ ] New features include docstrings
- [ ] Changes work on both Windows and Linux (if applicable)
- [ ] CHANGELOG.md updated
- [ ] No unrelated changes included

## Release Process

See [RELEASE_STANDARDS.md](RELEASE_STANDARDS.md) for detailed release procedures.

## Debugging

### Common Issues

- **"Permission denied" on Docker output**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#docker-permission-denied)
- **Tests failing locally**: Ensure all dependencies installed: `pip install -r requirements.txt`
- **Frontend not updating**: Kill dev server, clear browser cache, restart: `python scripts/dev.py`

### Getting Help

1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Review existing GitHub issues
3. Open a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Environment (OS, Python version, Docker version)
   - Relevant logs/errors

## Architecture Questions

For questions about the overall design, see [ARCHITECTURE.md](ARCHITECTURE.md) or review:
- `autofiller/pipeline.py` - Main processing flow
- `autofiller/web_app.py` - Flask server and API handlers
- `frontend/src/App.jsx` - React UI entry point

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for helping make Jisho2Anki better for everyone!
