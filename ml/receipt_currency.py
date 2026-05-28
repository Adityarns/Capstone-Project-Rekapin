"""
Deteksi & parsing nominal struk MYR (Malaysia) dan IDR (Indonesia).

MobileNet ``receipt_total_model`` dilatih pada SROIE (MYR). Untuk struk IDR,
gunakan OCR/regex; fallback model dinonaktifkan otomatis.
"""

from __future__ import annotations

import re
from typing import List, Optional

CURRENCY_MYR = "MYR"
CURRENCY_IDR = "IDR"
SUPPORTED_CURRENCIES = (CURRENCY_MYR, CURRENCY_IDR)

_IDR_HINTS = re.compile(
    r"\b(rp\.?|rupiah|idr|ppn|pajak|npwp|pb1|total\s*bayar|jumlah\s*bayar)\b",
    re.I,
)
_MYR_HINTS = re.compile(
    r"\b(rm\.?|ringgit|myr|sst\s*id|gst\b|amount\s*\(\s*rm\s*\))\b",
    re.I,
)
_CURRENCY_PREFIX = re.compile(r"^(?:Rp\.?|RM|MYR|IDR)\s*", re.I)
_IDR_DOT_THOUSANDS = re.compile(r"^\d{1,3}(\.\d{3})+$")
_IDR_COMMA_THOUSANDS = re.compile(r"^\d{1,3}(,\d{3})+$")


def detect_currency_from_text(text: str) -> Optional[str]:
    """Return ``MYR`` or ``IDR`` from free text; ``None`` if ambiguous."""
    if not text:
        return None
    idr = len(_IDR_HINTS.findall(text))
    myr = len(_MYR_HINTS.findall(text))
    if idr > myr and idr > 0:
        return CURRENCY_IDR
    if myr > idr and myr > 0:
        return CURRENCY_MYR
    return None


def detect_currency_from_lines(lines: List[str]) -> str:
    """
    Guess receipt currency from OCR/box lines.

    Defaults to ``MYR`` (SROIE training) unless IDR signals or IDR-style amounts dominate.
    """
    corpus = " ".join(lines)
    explicit = detect_currency_from_text(corpus)
    if explicit:
        return explicit

    idr_amounts = 0
    myr_amounts = 0
    for line in lines:
        for token in re.findall(r"[\d.,]+", line):
            if _IDR_DOT_THOUSANDS.match(token) or _IDR_COMMA_THOUSANDS.match(token):
                idr_amounts += 1
            elif re.match(r"^[\d,]+\.\d{2}$", token):
                myr_amounts += 1

    if idr_amounts > myr_amounts and idr_amounts > 0:
        return CURRENCY_IDR
    return CURRENCY_MYR


def parse_money_amount(
    token: str,
    currency: Optional[str] = None,
    *,
    lines_hint: Optional[List[str]] = None,
) -> Optional[float]:
    """
    Parse a money string to float in major units (RM or Rp).

    MYR: ``89.50``, ``1,234.56`` (koma ribuan, titik desimal).
    IDR: ``150.000``, ``1.500.000``, ``Rp 50.000``, ``150,000``.
    """
    if token is None:
        return None
    raw = str(token).strip()
    if not raw:
        return None

    if currency is None and lines_hint:
        currency = detect_currency_from_lines(lines_hint)
    if currency is None:
        currency = detect_currency_from_text(raw) or CURRENCY_MYR

    s = _CURRENCY_PREFIX.sub("", raw).strip()
    s = s.replace(" ", "")
    if not s or not re.search(r"\d", s):
        return None

    if currency == CURRENCY_IDR:
        if _IDR_DOT_THOUSANDS.match(s):
            return float(s.replace(".", ""))
        if _IDR_COMMA_THOUSANDS.match(s):
            return float(s.replace(",", ""))
        if "," in s and "." not in s:
            return float(s.replace(",", ""))
        if "." in s:
            parts = s.split(".")
            if len(parts) == 2 and len(parts[1]) <= 2:
                return float(s)
            if all(len(p) == 3 for p in parts[1:]):
                return float(s.replace(".", ""))
        val = _safe_float(s.replace(",", ""))
        return val if val is not None and val > 0 else None

    # MYR / default: comma thousands, dot decimal
    if "," in s and "." in s:
        s = s.replace(",", "")
    elif "," in s and "." not in s:
        if re.match(r"^\d+,\d{2}$", s):
            s = s.replace(",", ".")
        else:
            s = s.replace(",", "")
    val = _safe_float(s)
    return val if val is not None and 0 < val < 1e9 else None


def _safe_float(s: str) -> Optional[float]:
    try:
        return float(s)
    except ValueError:
        return None


def money_amount_regex_fragment(currency: str) -> str:
    """Regex fragment for capturing amounts in ``extract_total_from_box_lines``."""
    if currency == CURRENCY_IDR:
        return r"(?:Rp\.?\s*)?(?:\d{1,3}(?:\.\d{3})+|\d+(?:,\d{3})*|\d+)"
    return r"[\d,]+\.\d{2}"


def format_amount_label(amount: float, currency: str) -> str:
    """Human-readable amount with currency code (for logs)."""
    if currency == CURRENCY_IDR:
        return f"Rp {amount:,.0f}".replace(",", ".")
    return f"RM {amount:.2f}"
