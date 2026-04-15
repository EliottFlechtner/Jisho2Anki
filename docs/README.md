# Jisho2Anki Documentation

Welcome to the comprehensive documentation for Jisho2Anki. This directory contains all guides, references, and troubleshooting information.

## Quick Navigation

### Getting Started
- **[Contributing.md](CONTRIBUTING.md)** — Set up your development environment, coding standards, testing guidelines, and PR workflow
- **[WINDOWS_DEV.md](WINDOWS_DEV.md)** — Windows-specific setup, Docker Desktop configuration, and common Windows issues

### Understanding the Project
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** — Complete directory overview, module descriptions, data flow diagrams, and architecture decisions
- **[EXAMPLE.md](EXAMPLE.md)** — Example usage and workflows

### Troubleshooting & References
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** — Solutions to common problems (Docker, AnkiConnect, pitch accent, frontend, tests)
- **[RELEASE_STANDARDS.md](RELEASE_STANDARDS.md)** — Release process and version management standards
- **[CHANGELOG.md](CHANGELOG.md)** — Version history and release notes

## For Different Roles

### I want to contribute code
1. Start with [Contributing.md](CONTRIBUTING.md)
2. Understand the project structure in [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
3. If you hit issues, check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### I'm having problems
→ Go directly to [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### I'm on Windows
→ Read [WINDOWS_DEV.md](WINDOWS_DEV.md) for platform-specific setup

### I want to understand the codebase
→ Read [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for a complete architecture overview

### I want to make a release
→ Check [RELEASE_STANDARDS.md](RELEASE_STANDARDS.md) for the process

### I want to see what's new
→ Read [CHANGELOG.md](CHANGELOG.md) for version history

## Key Concepts

- **Jisho2Anki** is a tool to generate Anki flashcards from Japanese vocabulary
- It can run in **CLI mode** (command-line), **web UI mode** (local React frontend), or **Docker** (recommended)
- It integrates with **Anki via AnkiConnect** addon
- It supports **pitch accent generation** using external data files
- It's **cross-platform** (Windows, Mac, Linux)

## Common Commands

```bash
# Start the application
make up

# View logs
make logs

# Run tests
make test

# Control stack
make down
make ps
```

See [CONTRIBUTING.md](CONTRIBUTING.md) or run `make help` for all available commands.
