"""Persistent LINE inbox storage for phone-captured vocabulary."""

from __future__ import annotations

import sqlite3
import time
from pathlib import Path
from typing import Any

ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_PATH = ROOT_DIR / "output" / "line_inbox.sqlite3"


def _connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    return conn


def ensure_inbox_db(db_path: Path = DEFAULT_DB_PATH) -> None:
    """Create inbox table if missing."""
    with _connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS line_inbox (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT NOT NULL,
                source TEXT NOT NULL DEFAULT '',
                received_at_ms INTEGER NOT NULL,
                created_at_ms INTEGER NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                ankied_at_ms INTEGER
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_line_inbox_status ON line_inbox(status)"
        )
        conn.commit()


def add_inbox_items(
    items: list[str],
    *,
    source: str = "line",
    received_at_ms: int | None = None,
    db_path: Path = DEFAULT_DB_PATH,
) -> list[dict[str, Any]]:
    """Insert pending inbox items and return inserted rows."""
    ensure_inbox_db(db_path)
    now_ms = int(time.time() * 1000)
    ts_ms = int(received_at_ms or now_ms)
    cleaned = [str(item).strip() for item in items if str(item).strip()]
    if not cleaned:
        return []

    inserted: list[dict[str, Any]] = []
    with _connect(db_path) as conn:
        for text in cleaned:
            cursor = conn.execute(
                """
                INSERT INTO line_inbox(text, source, received_at_ms, created_at_ms, status)
                VALUES (?, ?, ?, ?, 'pending')
                """,
                (text, source, ts_ms, now_ms),
            )
            inserted.append(
                {
                    "id": int(cursor.lastrowid),
                    "text": text,
                    "source": source,
                    "received_at_ms": ts_ms,
                    "status": "pending",
                }
            )
        conn.commit()
    return inserted


def list_pending_inbox_items(
    *,
    limit: int = 200,
    db_path: Path = DEFAULT_DB_PATH,
) -> list[dict[str, Any]]:
    """Return pending inbox rows ordered oldest-first."""
    ensure_inbox_db(db_path)
    safe_limit = max(1, min(int(limit), 1000))
    with _connect(db_path) as conn:
        rows = conn.execute(
            """
            SELECT id, text, source, received_at_ms, created_at_ms, status
            FROM line_inbox
            WHERE status = 'pending'
            ORDER BY id ASC
            LIMIT ?
            """,
            (safe_limit,),
        ).fetchall()
    return [dict(row) for row in rows]


def mark_inbox_items_ankied(
    ids: list[int],
    *,
    db_path: Path = DEFAULT_DB_PATH,
) -> int:
    """Mark pending inbox rows as ankied. Returns count changed."""
    ensure_inbox_db(db_path)
    clean_ids = sorted({int(item) for item in ids if int(item) > 0})
    if not clean_ids:
        return 0

    now_ms = int(time.time() * 1000)
    placeholders = ",".join(["?"] * len(clean_ids))
    with _connect(db_path) as conn:
        cursor = conn.execute(
            f"""
            UPDATE line_inbox
            SET status = 'ankied', ankied_at_ms = ?
            WHERE status = 'pending' AND id IN ({placeholders})
            """,
            (now_ms, *clean_ids),
        )
        conn.commit()
        return int(cursor.rowcount)


def pending_inbox_count(*, db_path: Path = DEFAULT_DB_PATH) -> int:
    """Return count of pending inbox rows."""
    ensure_inbox_db(db_path)
    with _connect(db_path) as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS count FROM line_inbox WHERE status = 'pending'"
        ).fetchone()
    return int(row["count"] if row else 0)
