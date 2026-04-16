#!/usr/bin/env python
"""Cross-platform Docker Compose wrapper for Jisho2Anki."""

import subprocess
import sys
import os
import platform
import time
import urllib.request
import urllib.error


def _read_env_file_value(path: str, key: str) -> str | None:
    """Read a single KEY value from an env-style file."""
    try:
        with open(path, "r", encoding="utf-8") as handle:
            for line in handle:
                stripped = line.strip()
                if not stripped or stripped.startswith("#") or "=" not in stripped:
                    continue
                env_key, raw_value = stripped.split("=", 1)
                if env_key.strip() != key:
                    continue
                return raw_value.strip().strip('"').strip("'")
    except FileNotFoundError:
        return None
    return None


def _is_truthy(value: str | None) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def get_compose_args():
    """Get docker compose arguments based on platform."""
    args = ["docker", "compose", "-f", "config/docker-compose.yml"]

    linux_host_network_raw = os.environ.get("ANKI_JISHO2ANKI_LINUX_HOST_NETWORK")
    if linux_host_network_raw is None:
        linux_host_network_raw = _read_env_file_value(
            ".env.docker", "ANKI_JISHO2ANKI_LINUX_HOST_NETWORK"
        )
    linux_host_network = _is_truthy(linux_host_network_raw)

    # Add Windows overrides on Windows
    if sys.platform in ("win32", "cygwin") or platform.system() == "Windows":
        args.extend(["-f", "config/docker-compose.windows.yml"])
    elif platform.system() == "Linux" and linux_host_network:
        args.extend(["-f", "config/docker-compose.linux-host.yml"])

    args.extend(["--env-file", ".env.docker"])
    return args


def run_up():
    """Run 'docker compose up' with appropriate platform settings."""
    compose_args = get_compose_args()

    # Debug: Show what command we're running
    print(f"[DEBUG] Compose args: {' '.join(compose_args)}")

    # Try to pull prebuilt image
    print("Attempting to pull prebuilt image...")
    pull_cmd = compose_args + ["pull", "--ignore-pull-failures"]
    subprocess.run(pull_cmd, capture_output=True)

    # Try to start without building
    up_cmd = compose_args + ["up", "-d", "--no-build"]
    result = subprocess.run(up_cmd)

    if result.returncode == 0:
        port = os.environ.get("APP_PORT", "5000")
        print(f"Jisho2Anki is starting at http://127.0.0.1:{port}")
        return 0

    # If that failed, build and try again
    print("No runnable image found. Building image now...")
    build_cmd = compose_args + ["build"]
    build_result = subprocess.run(build_cmd)

    if build_result.returncode != 0:
        print("\n[ERROR] Build failed!")
        print("Possible causes:")
        print("  1) Host Docker DNS/connectivity problem")
        print("  2) PyPI or package repository is unreachable")
        print("  3) Docker daemon is not running or out of disk space")
        print("\nTroubleshooting steps:")
        print("  1) docker run --rm busybox nslookup pypi.org")
        print("  2) Restart Docker daemon")
        print("  3) Check available disk: df -h")
        print("  4) If behind proxy, set HTTP_PROXY/HTTPS_PROXY/NO_PROXY and retry")
        print("  5) Optionally set PIP_INDEX_URL in .env.docker")
        return 1

    # Start after building
    subprocess.run(compose_args + ["up", "-d"])
    port = os.environ.get("APP_PORT", "5000")
    print(f"Jisho2Anki is starting at http://127.0.0.1:{port}")
    return 0


def run_healthz():
    """Wait for and verify health endpoint."""
    port = os.environ.get("APP_PORT", "5000")
    url = f"http://127.0.0.1:{port}/healthz"

    print("Waiting for health endpoint...")
    for i in range(1, 31):
        try:
            urllib.request.urlopen(url, timeout=3)
            print("Health check passed")
            # Verify bootstrap endpoint
            try:
                urllib.request.urlopen(
                    f"http://127.0.0.1:{port}/api/bootstrap", timeout=3
                )
                print("Smoke check OK")
                return 0
            except urllib.error.URLError:
                print("Bootstrap endpoint failed")
                return 1
        except urllib.error.URLError:
            if i < 30:
                time.sleep(1)
            continue

    print("Health endpoint did not become ready in time")
    return 1


def run_build_dev():
    """Build dev image with platform-specific settings."""
    if platform.system() == "Windows":
        # Windows: skip BUILDKIT and --network=host
        cmd = [
            "docker",
            "build",
            "-f",
            "config/Dockerfile",
            "-t",
            "jisho2anki:dev",
            ".",
        ]
    else:
        # Linux/Mac: use BUILDKIT for DNS fixes
        env = os.environ.copy()
        env["DOCKER_BUILDKIT"] = "1"
        cmd = [
            "docker",
            "build",
            "--network=host",
            "-f",
            "config/Dockerfile",
            "-t",
            "jisho2anki:dev",
            ".",
        ]
        return subprocess.run(cmd, env=env).returncode

    return subprocess.run(cmd).returncode


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python docker_wrapper.py [up|healthz|build-dev]")
        return 1

    command = sys.argv[1]

    if command == "up":
        return run_up()
    elif command == "healthz":
        return run_healthz()
    elif command == "build-dev":
        return run_build_dev()
    else:
        print(f"Unknown command: {command}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
