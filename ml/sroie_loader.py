"""
Load and clean SROIE receipt metadata (entities JSON) and optional box transcripts.

Dataset root resolution (first match wins):
  1. ``REKAPIN_SROIE_ROOT`` environment variable
  2. ``<repo>/sroie2/`` (expanded set from ``struk_umum2`` / sroie2.zip)
  3. ``<repo>/sroie/``

Entity/box merge (logical, no folder rename):
  - ``folder_entity_output/`` preferred over ``entities/`` on stem conflict
  - ``folder_box_output/`` preferred over ``box/`` on stem conflict
  - ``normalize_stem`` strips ``(1)`` duplicates and ``.txt`` / ``.jpg``

Pelatihan model struk memakai modul ini — bukan notebook ``struk_umum.ipynb`` (deprecated).
Notebook kanonik: ``struk_umum2.ipynb``.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import pandas as pd
from PIL import Image

# Folder names (new friend dataset first in priority lists)
ENTITY_DIR_NAMES = ("folder_entity_output", "entities")
BOX_DIR_NAMES = ("folder_box_output", "box")


def repo_root() -> Path:
    """Directory containing ``sroie/`` or ``sroie2/`` (parent of ``ml/``)."""
    return Path(__file__).resolve().parent.parent


def normalize_stem(name: str) -> str:
    """
    Map file stem to canonical image stem (``X510....``).

    Examples: ``X51007339647(1).txt`` → ``X51007339647``;
    ``X51007339647.jpg`` → ``X51007339647``.
    """
    stem = Path(name).stem
    stem = re.sub(r"\(\d+\)$", "", stem)
    return stem


def resolve_sroie_root(root: Optional[Path] = None) -> Path:
    """
    Return SROIE root folder.

    Accepts roots with ``entities/`` or ``folder_entity_output/``.
    Prefer ``sroie2`` when present; else ``sroie``.
    """
    if root is not None:
        p = Path(root)
        if _has_entity_source(p) or (p / "img").is_dir():
            return p

    base = repo_root()
    env = os.environ.get("REKAPIN_SROIE_ROOT")
    if env:
        p = Path(env)
        if _has_entity_source(p):
            return p
    for name in ("sroie2", "sroie"):
        candidate = base / name
        if _has_entity_source(candidate):
            return candidate
    fallback = base / "sroie"
    if (fallback / "folder_entity_output").is_dir() or (fallback / "img").is_dir():
        return fallback
    return fallback


def _has_entity_source(root: Path) -> bool:
    return any((root / d).is_dir() for d in ENTITY_DIR_NAMES)


def list_entity_dirs(root: Optional[Path] = None) -> List[Path]:
    """Entity label folders in priority order (newer ``folder_entity_output`` first)."""
    sroie_root = resolve_sroie_root(root)
    return [sroie_root / d for d in ENTITY_DIR_NAMES if (sroie_root / d).is_dir()]


def list_box_dirs(root: Optional[Path] = None) -> List[Path]:
    """Box transcript folders in priority order."""
    sroie_root = resolve_sroie_root(root)
    return [sroie_root / d for d in BOX_DIR_NAMES if (sroie_root / d).is_dir()]


def default_sroie_dirs(root: Optional[Path] = None) -> Tuple[Path, Path, Path]:
    """Return ``(primary_entities_dir, img_dir, primary_box_dir)`` — highest-priority sources."""
    sroie_root = resolve_sroie_root(root)
    ent = list_entity_dirs(sroie_root)
    box = list_box_dirs(sroie_root)
    return (
        ent[0] if ent else sroie_root / "entities",
        sroie_root / "img",
        box[0] if box else sroie_root / "box",
    )


def _read_entity_file(path: Path) -> Optional[dict]:
    try:
        raw = path.read_text(encoding="utf-8", errors="replace")
        return json.loads(raw)
    except (json.JSONDecodeError, OSError):
        return None


def load_entities_from_dir(entities_dir: Path, source_name: str) -> pd.DataFrame:
    rows = []
    if not entities_dir.is_dir():
        return pd.DataFrame()
    for name in os.listdir(entities_dir):
        if not name.endswith(".txt"):
            continue
        path = entities_dir / name
        data = _read_entity_file(path)
        if data is None:
            continue
        stem = normalize_stem(name)
        rows.append(
            {
                "stem": stem,
                "nama_gambar": f"{stem}.jpg",
                "company": data.get("company"),
                "date": data.get("date"),
                "address": data.get("address"),
                "total": data.get("total"),
                "source_entity": source_name,
                "entity_path": str(path.resolve()),
            }
        )
    return pd.DataFrame(rows)


def load_entities_merged(
    root: Optional[Path] = None,
) -> Tuple[pd.DataFrame, Dict[str, int]]:
    """
    Merge all entity sources; on stem conflict prefer earlier dir in ``list_entity_dirs``.

    Returns ``(dataframe, stats_dict)``.
    """
    sroie_root = resolve_sroie_root(root)
    dirs = list_entity_dirs(sroie_root)
    if not dirs:
        raise FileNotFoundError(f"No entity folders under {sroie_root}")

    merged: Dict[str, dict] = {}
    stats: Dict[str, int] = {"sources": len(dirs), "duplicates_skipped": 0}
    per_source: Dict[str, int] = {}

    for ent_dir in dirs:
        source = ent_dir.name
        df = load_entities_from_dir(ent_dir, source)
        per_source[source] = len(df)
        for _, row in df.iterrows():
            stem = row["stem"]
            if stem in merged:
                stats["duplicates_skipped"] += 1
                continue
            merged[stem] = row.to_dict()

    stats["per_source"] = per_source  # type: ignore[assignment]
    stats["merged_unique_stems"] = len(merged)
    return pd.DataFrame(list(merged.values())), stats


def load_entities_dataframe(
    entities_dir: Optional[Path] = None,
) -> pd.DataFrame:
    """Legacy: load single entity folder (no merge)."""
    entities_dir = entities_dir or default_sroie_dirs()[0]
    df = load_entities_from_dir(entities_dir, entities_dir.name)
    if df.empty and not entities_dir.is_dir():
        raise FileNotFoundError(f"Missing entities folder: {entities_dir}")
    return df.drop(columns=["stem", "source_entity", "entity_path"], errors="ignore")


def clean_entities_df(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["total"] = (
        out["total"].astype(str).str.replace(r"[^\d\.]", "", regex=True)
    )
    out["total"] = pd.to_numeric(out["total"], errors="coerce")
    out["date"] = pd.to_datetime(out["date"], errors="coerce", dayfirst=True)
    # Drop parse outliers (e.g. merged entity typos); typical SROIE totals < 100k
    out.loc[out["total"] > 100_000, "total"] = pd.NA
    return out


def build_ledger_from_entities(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transaction ledger: one row per receipt with parsed date/amount.

    Columns: ``stem``, ``date``, ``amount``, ``merchant``, ``nama_gambar``, ``source_entity``.
    """
    d = clean_entities_df(df)
    rows = []
    for _, r in d.iterrows():
        if pd.isna(r.get("total")) or pd.isna(r.get("date")):
            continue
        rows.append(
            {
                "stem": r.get("stem", normalize_stem(str(r.get("nama_gambar", "")))),
                "date": r["date"].normalize() if pd.notna(r["date"]) else None,
                "amount": float(r["total"]),
                "merchant": r.get("company"),
                "nama_gambar": r.get("nama_gambar"),
                "source_entity": r.get("source_entity"),
            }
        )
    return pd.DataFrame(rows)


def _normalize_box(box: List[float], width: int, height: int) -> List[int]:
    x_min, y_min, x_max, y_max = box
    return [
        int(1000 * (x_min / width)),
        int(1000 * (y_min / height)),
        int(1000 * (x_max / width)),
        int(1000 * (y_max / height)),
    ]


def parse_box_file(
    box_path: Path, image_path: Path
) -> List[dict]:
    """Parse one SROIE box file into list of dicts with text and normalized coords."""
    if not box_path.is_file() or not image_path.is_file():
        return []
    try:
        img = Image.open(image_path)
        w, h = img.size
    except OSError:
        return []

    lines_out: List[dict] = []
    try:
        with open(box_path, encoding="utf-8", errors="replace") as f:
            raw_lines = f.readlines()
    except OSError:
        return []

    for line in raw_lines:
        parts = line.strip().split(",")
        if len(parts) < 9:
            continue
        try:
            xs = [int(parts[0]), int(parts[2]), int(parts[4]), int(parts[6])]
            ys = [int(parts[1]), int(parts[3]), int(parts[5]), int(parts[7])]
        except ValueError:
            continue
        box = [min(xs), min(ys), max(xs), max(ys)]
        text = ",".join(parts[8:])
        norm = _normalize_box(box, w, h)
        lines_out.append(
            {
                "text": text,
                "box_xyxy": box,
                "box_norm_0_1000": norm,
            }
        )
    return lines_out


def _box_files_merged(box_dirs: List[Path]) -> Dict[str, Tuple[Path, str]]:
    """stem → (box_path, source_box_dir_name); first dir wins."""
    out: Dict[str, Tuple[Path, str]] = {}
    for box_dir in box_dirs:
        if not box_dir.is_dir():
            continue
        for name in os.listdir(box_dir):
            if not name.endswith(".txt"):
                continue
            stem = normalize_stem(name)
            if stem not in out:
                out[stem] = (box_dir / name, box_dir.name)
    return out


def build_bbox_lines_dataframe_merged(
    img_dir: Optional[Path] = None,
    root: Optional[Path] = None,
    prefer_box_dirs: Optional[List[str]] = None,
) -> pd.DataFrame:
    """One row per text line using merged box sources."""
    sroie_root = resolve_sroie_root(root)
    _, default_img, _ = default_sroie_dirs(sroie_root)
    img_dir = img_dir or default_img

    if prefer_box_dirs:
        box_dirs = [sroie_root / d for d in prefer_box_dirs if (sroie_root / d).is_dir()]
    else:
        box_dirs = list_box_dirs(sroie_root)

    records = []
    for stem, (box_path, source) in _box_files_merged(box_dirs).items():
        img_path = img_dir / f"{stem}.jpg"
        for item in parse_box_file(box_path, img_path):
            records.append(
                {
                    "stem": stem,
                    "nama_gambar": img_path.name,
                    "image_path": str(img_path.resolve()) if img_path.is_file() else "",
                    "source_box": source,
                    **item,
                }
            )
    return pd.DataFrame(records)


def build_bbox_lines_dataframe(
    img_dir: Optional[Path] = None,
    box_dir: Optional[Path] = None,
) -> pd.DataFrame:
    """Legacy wrapper: merged boxes from all sources."""
    if box_dir is not None:
        root = box_dir.parent
        names = [box_dir.name]
        return build_bbox_lines_dataframe_merged(img_dir, root, prefer_box_dirs=names)
    return build_bbox_lines_dataframe_merged(img_dir)


_SUBTOTAL_SKIP_RE = re.compile(
    r"total\s*sales|sub\s*total|service\s*tax|rounding|item\s*count|"
    r"qty\s*description|total\s*\(rm\)|total\s*\(rp\)|ppn|pajak|pb1|"
    r"dpp|purchase|trxid|customer\s*saved|layanan|telp|sms|kontak",
    re.I,
)


def _total_patterns(currency: str):
    from ml.receipt_currency import CURRENCY_IDR, money_amount_regex_fragment

    amt = money_amount_regex_fragment(currency)
    if currency == CURRENCY_IDR:
        preferred = re.compile(
            rf"(?:^|\b)(?:total\s*belanja|jumlah\s*bayar|non\s*tunai|edc)\b.*?({amt})",
            re.I,
        )
        grand = re.compile(
            rf"(?:^|\b)(?:grand\s*total|amount\s*due|jumlah\s*bayar|total\s*bayar|"
            rf"nett\s*total|total\s*belanja)\b[\s:]*({amt})",
            re.I,
        )
        strict = re.compile(rf"^\s*TOTAL\s*[:\s\-]*({amt})\s*$", re.I)
        final = re.compile(
            rf"(?:^|\b)TOTAL\b(?!\s*(?:Sales|sales|penjualan))\s*[:\s\-]*({amt})",
            re.I,
        )
    else:
        preferred = re.compile(
            rf"(?:^|\b)(?:grand\s*total|amount\s*due|nett\s*total)\b[^\dRM]*({amt})",
            re.I,
        )
        grand = re.compile(
            rf"(?:^|\b)(?:grand\s*total|amount\s*due|jumlah\s*bayar)\b[\s:]*({amt})",
            re.I,
        )
        strict = re.compile(rf"^\s*TOTAL\s*[:\s\-]*({amt})\s*$", re.I)
        final = re.compile(
            rf"(?:^|\b)TOTAL\b(?!\s*(?:Sales|sales))\s*[:\s\-]*({amt})",
            re.I,
        )
    return preferred, strict, grand, final


def _parse_money_token(token: str, currency: Optional[str] = None, lines: Optional[List[str]] = None) -> Optional[float]:
    from ml.receipt_currency import parse_money_amount

    return parse_money_amount(token, currency, lines_hint=lines)


def _merge_split_total_lines(lines: List[str], currency: str) -> List[str]:
    """Join ``TOTAL`` on one line and amount on the next (common OCR split)."""
    from ml.receipt_currency import CURRENCY_IDR

    merged: List[str] = []
    i = 0
    amount_tail = (
        r"^(?:Rp\.?\s*)?(?:\d{1,3}(?:\.\d{3})+|[\d,]+\.\d{2}|\d+)\s*$"
        if currency == CURRENCY_IDR
        else r"^[\d,]+\.\d{2}\s*$"
    )
    keyword_with_next_amount = re.compile(
        r"^\s*(?:total|total\s*belanja|jumlah\s*bayar|non\s*tunai|edc)\b",
        re.I,
    )
    while i < len(lines):
        stripped = lines[i].strip()
        if keyword_with_next_amount.match(stripped) and i + 1 < len(lines):
            nxt = lines[i + 1].strip()
            if re.match(amount_tail, nxt, re.I):
                merged.append(f"{stripped} {nxt}")
                i += 2
                continue
        merged.append(lines[i])
        i += 1
    return merged


def extract_total_from_box_lines(lines: List[str], currency: Optional[str] = None) -> Optional[float]:
    """
    Extract final receipt total from OCR/box text lines.

    Prefers grand-total style lines (``TOTAL 30.40``), not ``Total Sales Amount``.
    """
    if not lines:
        return None

    from ml.receipt_currency import CURRENCY_IDR, detect_currency_from_lines, money_amount_regex_fragment

    if currency is None:
        currency = detect_currency_from_lines(lines)

    lines = _merge_split_total_lines(lines, currency)
    preferred, strict, grand, final = _total_patterns(currency)
    n = len(lines)
    bottom_start = n // 2
    grand_candidates: List[tuple] = []

    for i, line in enumerate(lines):
        if _SUBTOTAL_SKIP_RE.search(line):
            continue
        stripped = line.strip()

        for pattern in (preferred, strict, grand, final):
            m = pattern.search(stripped)
            if m:
                amt = _parse_money_token(m.group(1), currency, lines)
                if amt is not None:
                    grand_candidates.append((i, amt))
                break

    if grand_candidates:
        bottom = [(i, v) for i, v in grand_candidates if i >= bottom_start]
        pool = bottom if bottom else grand_candidates
        if currency == CURRENCY_IDR:
            return max(pool, key=lambda t: t[1])[1]
        return max(pool, key=lambda t: t[0])[1]

    amt_pat = money_amount_regex_fragment(currency)
    bottom_nums: List[tuple] = []
    for i, line in enumerate(lines):
        if i < bottom_start or _SUBTOTAL_SKIP_RE.search(line):
            continue
        for token in re.findall(amt_pat, line, flags=re.I):
            amt = _parse_money_token(token, currency, lines)
            if amt is not None:
                bottom_nums.append((i, amt))
    # For IDR receipts, avoid blind numeric fallback from footer noise (phone/order IDs).
    if currency == CURRENCY_IDR:
        return None
    if bottom_nums:
        return max(bottom_nums, key=lambda t: (t[0], t[1]))[1]
    return None


def load_box_lines_for_stem(stem: str, root: Optional[Path] = None) -> List[str]:
    """All text lines for one receipt stem from merged box files."""
    sroie_root = resolve_sroie_root(root)
    img_dir = sroie_root / "img"
    stem = normalize_stem(stem)
    for box_dir in list_box_dirs(sroie_root):
        for name in os.listdir(box_dir):
            if normalize_stem(name) != stem:
                continue
            img_path = img_dir / f"{stem}.jpg"
            parsed = parse_box_file(box_dir / name, img_path)
            if parsed:
                return [p["text"] for p in parsed]
    return []


def build_training_pairs(
    df_clean: pd.DataFrame,
    img_dir: Optional[Path] = None,
) -> pd.DataFrame:
    """Merge cleaned totals with existing image paths; drop rows without image file."""
    _, default_img, _ = default_sroie_dirs()
    img_dir = img_dir or default_img
    rows = []
    for _, r in df_clean.iterrows():
        img_path = img_dir / r["nama_gambar"]
        if not img_path.is_file():
            continue
        if pd.isna(r["total"]):
            continue
        rows.append(
            {
                "image_path": str(img_path.resolve()),
                "nama_gambar": r["nama_gambar"],
                "stem": r.get("stem", normalize_stem(str(r["nama_gambar"]))),
                "total": float(r["total"]),
                "company": r.get("company"),
                "date": r.get("date"),
                "source_entity": r.get("source_entity"),
            }
        )
    return pd.DataFrame(rows)


def filter_reasonable_receipt_dates(df: pd.DataFrame) -> pd.DataFrame:
    """Drop entity rows with unparseable or outlier calendar dates (SROIE noise)."""
    d = df.dropna(subset=["date"]).copy()
    if d.empty:
        return d
    yrs = d["date"].dt.year
    return d[(yrs >= 2010) & (yrs <= 2030)]


def daily_global_spend_series(df_clean: pd.DataFrame) -> pd.Series:
    """
    Aggregate total receipt amounts per calendar day (global across all merchants).

    Days with no receipts are omitted from the index (caller can reindex).
    """
    d = filter_reasonable_receipt_dates(df_clean.dropna(subset=["total"]))
    if d.empty:
        return pd.Series(dtype=float)
    g = d.groupby(d["date"].dt.normalize())["total"].sum().sort_index()
    return g


def daily_series_filled(
    daily: pd.Series,
    fill_value: float = 0.0,
) -> pd.Series:
    """Reindex to full date range from min to max; missing days = fill_value."""
    if daily.empty:
        return daily
    idx = pd.date_range(daily.index.min(), daily.index.max(), freq="D")
    return daily.reindex(idx, fill_value=fill_value)


def merge_stats_summary(root: Optional[Path] = None) -> Dict[str, object]:
    """Counts for verify script / notebook."""
    sroie_root = resolve_sroie_root(root)
    _, stats = load_entities_merged(sroie_root)
    box_dirs = list_box_dirs(sroie_root)
    box_counts = {}
    for bd in box_dirs:
        if bd.is_dir():
            box_counts[bd.name] = sum(
                1 for n in os.listdir(bd) if n.endswith(".txt")
            )
    merged_boxes = len(_box_files_merged(box_dirs))
    stats["box_per_source"] = box_counts
    stats["merged_unique_box_stems"] = merged_boxes
    stats["sroie_root"] = str(sroie_root)
    return stats


def prepare_receipt_training_data(
    root: Optional[Path] = None,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Path]:
    """
    Full pipeline used by ``struk_umum2.ipynb`` and ``ml.receipt_total_model``.

    Returns:
        df_clean, pairs (image_path + total), df_bbox_lines, sroie_root
    """
    sroie_root = resolve_sroie_root(root)
    _, img_dir, _ = default_sroie_dirs(sroie_root)
    df_raw, merge_stats = load_entities_merged(sroie_root)
    df_clean = clean_entities_df(df_raw)
    pairs = build_training_pairs(df_clean, img_dir)
    df_lines = build_bbox_lines_dataframe_merged(img_dir, sroie_root)
    return df_clean, pairs, df_lines, sroie_root