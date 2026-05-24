"""
Build carbon-classification text dataset from dummy samples + SROIE box line mining.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from ml.sroie_loader import (
    build_bbox_lines_dataframe_merged,
    resolve_sroie_root,
)

# Active training classes (3 Pertamina gasoline grades)
FUEL_CLASS_RON90 = "bensin_ron90"
FUEL_CLASS_RON92 = "bensin_ron92"
FUEL_CLASS_RON95 = "bensin_ron95"

CARBON_CLASS_LABELS = [FUEL_CLASS_RON90, FUEL_CLASS_RON92, FUEL_CLASS_RON95]

_FUEL_PATTERNS: List[Tuple[re.Pattern, str]] = [
    (re.compile(r"pertalite|ron\s*90|ron90", re.I), FUEL_CLASS_RON90),
    (
        re.compile(
            r"pertamax\s*turbo|ron\s*95|ron95|inf\s*ron95|petrol\s*ron\s*95",
            re.I,
        ),
        FUEL_CLASS_RON95,
    ),
    (re.compile(r"pertamax|ron\s*92|ron92", re.I), FUEL_CLASS_RON92),
]

_LITER_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(?:l|liter|litre|lt)\b", re.I)


def classify_fuel_text(text: str) -> Optional[str]:
    """Return fuel class key or None if no BBM keyword."""
    if not text or not text.strip():
        return None
    for pattern, label in _FUEL_PATTERNS:
        if pattern.search(text):
            return label
    return None


def detect_fuel_text(text: str) -> Optional[str]:
    """Alias for pipeline: return matched fuel class from free text."""
    return classify_fuel_text(text)


def extract_volume_liter(text: str, default: float = 10.0) -> float:
    m = _LITER_RE.search(text or "")
    if m:
        return float(m.group(1))
    return default


def _expanded_dummy() -> List[Tuple[str, float, str]]:
    """Synthetic ID/EN phrases for 3 fuel classes."""
    base: List[Tuple[str, float, str]] = []
    templates_r90 = [
        "pembelian pertalite {v} liter di spbu",
        "isi ulang bensin ron 90 pertalite motor",
        "transaksi pertalite kendaraan operasional {v}l",
        "bbm ron90 pertalite fleet",
        "fuel purchase pertalite ron 90",
        "prtalite {v} liter spbu",
        "spbu pertalite harian umkm",
    ]
    templates_r92 = [
        "isi ulang pertamax ron 92 {v} liter",
        "pembelian pertamax mobil dinas",
        "transaksi bbm pertamax ron92",
        "refueling pertamax armada {v}l",
        "bensin pertamax di spbu",
        "prtamax {v} liter operasional",
        "gasoline ron92 pertamax station",
    ]
    templates_r95 = [
        "pembelian pertamax turbo ron 95 {v} liter",
        "isi ulang ron95 pertamax turbo",
        "inf ron95 petrol given relief {v}l",
        "bensin ron 95 turbo executive car",
        "pertamax turbo full tank {v} liter",
        "ron95 petrol spbu",
        "petrol ron 95 turbo refill",
    ]
    vols = [5.0, 10.0, 15.0, 20.0, 30.0, 40.0, 50.0]
    for tpl in templates_r90:
        for v in vols:
            base.append((tpl.format(v=v), v, FUEL_CLASS_RON90))
    for tpl in templates_r92:
        for v in vols:
            base.append((tpl.format(v=v), v, FUEL_CLASS_RON92))
    for tpl in templates_r95:
        for v in vols:
            base.append((tpl.format(v=v), v, FUEL_CLASS_RON95))
    return base


def mine_fuel_samples_from_boxes(root: Optional[Path] = None) -> List[Tuple[str, float, str]]:
    """Scan merged box lines for RON / Pertamina keywords."""
    sroie_root = resolve_sroie_root(root)
    img_dir = sroie_root / "img"
    df = build_bbox_lines_dataframe_merged(img_dir, sroie_root)
    samples: List[Tuple[str, float, str]] = []
    seen: set = set()
    if df.empty:
        return samples
    for _, row in df.iterrows():
        text = str(row.get("text", ""))
        label = classify_fuel_text(text)
        if not label:
            continue
        key = (text.lower()[:80], label)
        if key in seen:
            continue
        seen.add(key)
        samples.append((text, extract_volume_liter(text), label))
    return samples


def build_carbon_text_dataset(root: Optional[Path] = None) -> List[Tuple[str, float, str]]:
    """Dummy + mined box lines; deduplicated."""
    merged = _expanded_dummy() + mine_fuel_samples_from_boxes(root)
    out: List[Tuple[str, float, str]] = []
    seen: set = set()
    for text, vol, label in merged:
        key = (text.lower().strip(), label)
        if key in seen:
            continue
        seen.add(key)
        out.append((text, vol, label))
    return out


def carbon_dataset_stats(root: Optional[Path] = None) -> Dict[str, int]:
    ds = build_carbon_text_dataset(root)
    mined = mine_fuel_samples_from_boxes(root)
    per_class = {c: 0 for c in CARBON_CLASS_LABELS}
    for _, _, label in ds:
        per_class[label] = per_class.get(label, 0) + 1
    return {
        "carbon_total_samples": len(ds),
        "carbon_mined_from_boxes": len(mined),
        "carbon_per_class": per_class,
    }
