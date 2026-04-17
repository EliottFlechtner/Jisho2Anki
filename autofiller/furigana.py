"""Furigana rendering helpers for vocabulary expressions."""

from __future__ import annotations

import html
import re

_KANJI_GROUP_RE = re.compile(r"[\u3400-\u4DB5\u4E00-\u9FFF々〆ヶ]+")


def _to_hiragana(text: str) -> str:
    """Convert katakana to hiragana, preserving non-kana characters."""
    chars: list[str] = []
    for char in text:
        code = ord(char)
        if 0x30A1 <= code <= 0x30F6:
            chars.append(chr(code - 0x60))
        else:
            chars.append(char)
    return "".join(chars)


def _is_kanji_group(text: str) -> bool:
    """Return True when `text` is entirely CJK kanji symbols."""
    return bool(text) and _KANJI_GROUP_RE.fullmatch(text) is not None


def _render_ruby(base: str, reading: str) -> str:
    """Render one ruby segment, escaping both base and reading."""
    if not reading:
        return html.escape(base)
    return f"<ruby>{html.escape(base)}<rt>{html.escape(reading)}</rt></ruby>"


def _render_anki(base: str, reading: str) -> str:
    """Render one Anki furigana segment using bracket syntax."""
    if not reading:
        return base
    return f"{base}[{reading}]"


def add_furigana(expression: str, reading: str, *, fmt: str = "ruby") -> str:
    """Add furigana markup to a Japanese expression.

    This uses a conservative alignment heuristic: kana literals in the expression
    anchor reading boundaries, and contiguous kanji groups consume the reading
    text between these anchors.

    Args:
        expression: Surface form (often with kanji).
        reading: Kana reading text.
        fmt: Output format: `ruby` or `anki`.

    Returns:
        Annotated expression text in requested format, or escaped/plain expression
        when furigana cannot be applied meaningfully.
    """
    cleaned_expr = (expression or "").strip()
    cleaned_reading = _to_hiragana((reading or "").strip())
    if not cleaned_expr or not cleaned_reading:
        return html.escape(cleaned_expr) if fmt == "ruby" else cleaned_expr

    if _KANJI_GROUP_RE.search(cleaned_expr) is None:
        return html.escape(cleaned_expr) if fmt == "ruby" else cleaned_expr

    fmt_name = fmt.strip().lower()
    render_group = _render_anki if fmt_name == "anki" else _render_ruby

    out_parts: list[str] = []
    read_idx = 0
    expr_idx = 0

    while expr_idx < len(cleaned_expr):
        match = _KANJI_GROUP_RE.match(cleaned_expr, expr_idx)
        if not match:
            char = cleaned_expr[expr_idx]
            if fmt_name == "ruby":
                out_parts.append(html.escape(char))
            else:
                out_parts.append(char)

            hira_char = _to_hiragana(char)
            if (
                read_idx < len(cleaned_reading)
                and cleaned_reading[read_idx] == hira_char
            ):
                read_idx += 1
            expr_idx += 1
            continue

        group = match.group(0)
        next_idx = match.end()

        next_kana_anchor = ""
        scan_idx = next_idx
        while scan_idx < len(cleaned_expr):
            if _KANJI_GROUP_RE.match(cleaned_expr, scan_idx):
                break
            next_kana_anchor += _to_hiragana(cleaned_expr[scan_idx])
            scan_idx += 1

        if next_kana_anchor:
            anchor_pos = cleaned_reading.find(next_kana_anchor, read_idx)
            group_reading = (
                cleaned_reading[read_idx:anchor_pos] if anchor_pos != -1 else ""
            )
            if anchor_pos != -1:
                read_idx = anchor_pos
        else:
            group_reading = cleaned_reading[read_idx:]
            read_idx = len(cleaned_reading)

        out_parts.append(render_group(group, group_reading))
        expr_idx = next_idx

    return "".join(out_parts)
