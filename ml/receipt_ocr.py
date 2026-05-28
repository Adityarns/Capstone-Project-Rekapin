"""
EasyOCR layer for user-uploaded receipts (no SROIE entity/box labels).

Set ``REKAPIN_DISABLE_OCR=1`` to skip OCR (CI / verify without model download).
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np

_READER = None
_LAST_CONFIDENCE: Optional[float] = None

_DATE_RE = re.compile(
    r"\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})(?:\s*[-–]\s*\d{1,2}:\d{2})?",
)
_YEAR_RE = re.compile(r"((?:19|20)\d{2})")
_MERCHANT_SKIP_RE = re.compile(
    r"^table$|^receipt$|^pex\b|^inv\s|^cashier|^\d{1,2}$|"
    r"receipt|tax\s*id|sst\s*id|inv\s*no|cashier|table\s*\d|pax\s*:|"
    r"^\d{2,}-\d|tel|phone|fax|www\.|http|@|"
    r"poskod|postcode|"
    r"\b\d{5}\b|johore?|selangor|kuala\s*lumpur|malaysia|"
    r"npwp|nppkp",
    re.I,
)
_ITEM_PRICE_TAIL_RE = re.compile(r"\d+(?:\.\d{1,2})?\s*$")


def ocr_disabled() -> bool:
    return os.environ.get("REKAPIN_DISABLE_OCR", "").strip().lower() in (
        "1",
        "true",
        "yes",
    )


def get_reader():
    """Lazy singleton EasyOCR reader (English receipts)."""
    global _READER
    if _READER is not None:
        return _READER
    import easyocr

    # English + Indonesian for MYR and IDR receipts
    _READER = easyocr.Reader(["en", "id"], gpu=False, verbose=False)
    return _READER


def last_ocr_confidence() -> Optional[float]:
    """Average detection confidence from the last ``ocr_receipt_lines`` call."""
    return _LAST_CONFIDENCE


def _preprocess_for_ocr(image_path: Path) -> np.ndarray:
    import cv2

    img = cv2.imread(str(image_path))
    if img is None:
        raise FileNotFoundError(image_path)
    h, w = img.shape[:2]
    if w < 1200:
        scale = 1200 / w
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)


def _preprocess_array_for_ocr(img: np.ndarray) -> np.ndarray:
    import cv2

    if img is None or img.size == 0:
        raise ValueError("empty image for OCR")
    h, w = img.shape[:2]
    if w < 1200:
        scale = 1200 / max(w, 1)
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)


def _group_detections_to_lines(
    detections: List[Tuple],
    *,
    y_tolerance: float = 18.0,
) -> List[str]:
    """Merge EasyOCR boxes into reading-order text lines."""
    if not detections:
        return []
    rows: List[dict] = []
    for bbox, text, conf in detections:
        text = str(text).strip()
        if not text:
            continue
        ys = [p[1] for p in bbox]
        xs = [p[0] for p in bbox]
        cy = float(sum(ys) / len(ys))
        cx = float(sum(xs) / len(xs))
        rows.append({"cy": cy, "cx": cx, "text": text, "conf": float(conf)})

    if not rows:
        return []

    rows.sort(key=lambda r: r["cy"])
    lines: List[List[dict]] = []
    for row in rows:
        placed = False
        for group in lines:
            if abs(row["cy"] - group[0]["cy"]) <= y_tolerance:
                group.append(row)
                placed = True
                break
        if not placed:
            lines.append([row])

    out: List[str] = []
    for group in lines:
        group.sort(key=lambda r: r["cx"])
        out.append(" ".join(r["text"] for r in group))
    return out


def ocr_receipt_lines(image_path: str | Path) -> List[str]:
    """
    Run EasyOCR on a receipt image and return merged text lines.

    Returns empty list if OCR is disabled or fails.
    """
    global _LAST_CONFIDENCE
    _LAST_CONFIDENCE = None

    if ocr_disabled():
        return []

    image_path = Path(image_path)
    if not image_path.is_file():
        raise FileNotFoundError(image_path)

    try:
        gray = _preprocess_for_ocr(image_path)
        reader = get_reader()
        detections = reader.readtext(gray, detail=1, paragraph=False)
    except Exception:
        return []

    confs = [float(d[2]) for d in detections if len(d) > 2]
    if confs:
        _LAST_CONFIDENCE = round(float(sum(confs) / len(confs)), 4)

    return _group_detections_to_lines(detections)


def ocr_receipt_sections(
    image_path: str | Path,
    *,
    item_top_ratio: float = 0.30,
    item_bottom_ratio: float = 0.74,
    total_top_ratio: float = 0.55,
    total_bottom_ratio: float = 0.96,
) -> Dict[str, List[str]]:
    """
    OCR per section to reduce noise:
    - full: all text
    - items: middle body for line items
    - totals: lower block for subtotal/total/payment
    """
    if ocr_disabled():
        return {"full": [], "items": [], "totals": []}

    image_path = Path(image_path)
    if not image_path.is_file():
        raise FileNotFoundError(image_path)

    import cv2

    img = cv2.imread(str(image_path))
    if img is None:
        raise FileNotFoundError(image_path)
    h = img.shape[0]
    item_top = max(0, min(h - 1, int(h * item_top_ratio)))
    item_bottom = max(item_top + 1, min(h, int(h * item_bottom_ratio)))
    total_top = max(0, min(h - 1, int(h * total_top_ratio)))
    total_bottom = max(total_top + 1, min(h, int(h * total_bottom_ratio)))

    sections = {
        "full": img,
        "items": img[item_top:item_bottom, :],
        "totals": img[total_top:total_bottom, :],
    }
    out: Dict[str, List[str]] = {"full": [], "items": [], "totals": []}

    reader = get_reader()
    global _LAST_CONFIDENCE
    _LAST_CONFIDENCE = None
    conf_all: List[float] = []
    for key, arr in sections.items():
        try:
            proc = _preprocess_array_for_ocr(arr)
            detections = reader.readtext(proc, detail=1, paragraph=False)
        except Exception:
            out[key] = []
            continue
        confs = [float(d[2]) for d in detections if len(d) > 2]
        conf_all.extend(confs)
        out[key] = _group_detections_to_lines(detections)

    if conf_all:
        _LAST_CONFIDENCE = round(float(sum(conf_all) / len(conf_all)), 4)
    return out


def extract_date_from_lines(lines: List[str]):
    """Parse first dd/mm/yyyy (or similar) with dayfirst; tolerates common OCR typos."""
    import pandas as pd

    for line in lines:
        compact = re.sub(r"\s+", "", line)
        parsed: Optional[tuple] = None

        ym = _YEAR_RE.search(compact)
        if ym:
            y_int = int(ym.group(1))
            if 1990 <= y_int <= 2035:
                window = compact[max(0, ym.start() - 10) : ym.start()]
                dm = re.search(r"(\d{1,2})[\/\-\.](\d{1,2})$", window)
                if not dm:
                    dm = re.search(r"(\d{1,2})[\/](\d{2})", window)
                if dm:
                    parsed = (dm.group(1), dm.group(2), str(y_int))

        if parsed is None:
            m = _DATE_RE.search(line) or _DATE_RE.search(compact)
            if m:
                d, mo, y = m.group(1), m.group(2), m.group(3)
                y_int = int(y)
                if y_int < 100:
                    y_int += 2000
                if 1990 <= y_int <= 2035:
                    parsed = (d, mo, str(y_int))

        if parsed is None:
            continue
        d, mo, y_int = parsed
        raw = f"{d}/{mo}/{y_int}"
        ts = pd.to_datetime(raw, errors="coerce", dayfirst=True)
        if pd.notna(ts) and 1990 <= int(ts.year) <= 2035:
            return ts
    return None


def extract_merchant_from_lines(lines: List[str]) -> str:
    """Best-effort merchant name from top of receipt."""
    for line in lines[:12]:
        cleaned = re.sub(r"\s+", " ", line).strip()
        if len(cleaned) < 3 or len(cleaned) > 80:
            continue
        if _MERCHANT_SKIP_RE.search(cleaned):
            continue
        if re.fullmatch(r"[\d\s\-\.\:]+", cleaned):
            continue
        if sum(c.isdigit() for c in cleaned) > len(cleaned) * 0.4:
            continue
        return cleaned
    return ""


def _normalize_ocr_item_line(line: str, currency: Optional[str] = None) -> str:
    """Fix common OCR price glitches (comma decimals, split cents, IDR thousands)."""
    from ml.receipt_currency import CURRENCY_IDR, detect_currency_from_lines, parse_money_amount

    cleaned = re.sub(r"\s+", " ", line).strip()
    if currency is None:
        currency = detect_currency_from_lines([line])

    if currency == CURRENCY_IDR:
        tail = re.search(r"(?:Rp\.?\s*)?([\d.,]+)\s*$", cleaned, re.I)
        if tail:
            amt = parse_money_amount(tail.group(1), CURRENCY_IDR)
            if amt is not None:
                name = cleaned[: tail.start()].strip(" -:")
                if name:
                    return f"{name} {int(amt) if amt == int(amt) else amt}"
        return cleaned

    cleaned = re.sub(r"(\d),(\d{2})\b", r"\1.\2", cleaned)
    split_cents = re.search(r"(\d+)\s+(\d{2})\s*$", cleaned)
    if split_cents and "." not in cleaned[split_cents.start() :]:
        cleaned = (
            cleaned[: split_cents.start()]
            + f"{split_cents.group(1)}.{split_cents.group(2)}"
        )
    return cleaned


def lines_to_line_items_text(lines: List[str], currency: Optional[str] = None) -> str:
    """Join OCR lines that look like purchasable items (name + trailing price)."""
    item_lines: List[str] = []
    skip = re.compile(
        r"total\s*sales|service\s*tax|rounding|sub\s*total|"
        r"^\s*total\b|amount\s*due|cashier|inv\s*no|receipt|table\s|"
        r"sst\s*id|^\s*pex\b|description\s*\(rm\)|description\s*\(rp\)|deseription|"
        r"roundlng|rounding\s*adjust|ppn|pajak|subtotal|non\s*tunai|edc|"
        r"order\s*no|receipt\s*no|customer|kasir|cashier|purchase|trxid|"
        r"telp|sms|kontak|layanan|gratis|ongkir|customer\s*saved|"
        r"uin|kampus|jalan|jl\.|no\.|kec\.|kab\.|jawa|barat|jakarta|"
        r"date\s|order\s*type|closed\s*bill|invoice|inv\s|npwp",
        re.I,
    )
    if currency is None:
        from ml.receipt_currency import detect_currency_from_lines

        currency = detect_currency_from_lines(lines)

    for line in lines:
        if skip.search(line):
            continue
        if re.search(r"\d{1,2}[\/\.\-]\d{1,2}[\/\.\-]\d{2,4}", line):
            continue
        if re.search(r"order\s*no|receipt\s*no|trx|trace|ab-\d+", line, re.I):
            continue
        normalized = _normalize_ocr_item_line(line, currency)
        if _ITEM_PRICE_TAIL_RE.search(normalized) and re.search(r"[A-Za-z]{2,}", normalized):
            item_lines.append(normalized)
    return "; ".join(item_lines[:30])
