"""Backward-compatible web app wrapper."""

from autofiller.web_app import DEFAULT_FLASK_HOST, DEFAULT_FLASK_PORT, app


if __name__ == "__main__":
    app.run(host=DEFAULT_FLASK_HOST, port=DEFAULT_FLASK_PORT, debug=False)
