"""
End-to-end receipt flow for Rekapin:

  struk (gambar) → structured transaction → ledger / forecast + carbon (jika teks BBM)

Hybrid ``parse_receipt``: entity JSON → box TOTAL regex → MobileNet regression.
"""

from __future__ import annotations

import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd

from ml.carbon_data import classify_fuel_text, detect_fuel_text, extract_volume_liter
from ml.sroie_loader import (
    clean_entities_df,
    daily_global_spend_series,
    daily_series_filled,
    extract_total_from_box_lines,
    load_box_lines_for_stem,
    load_entities_merged,
    merge_stats_summary,
    normalize_stem,
    prepare_receipt_training_data,
    repo_root,
    resolve_sroie_root,
)


def ingest_user_receipt(
    image_path: str | Path,
    *,
    company: Optional[str] = None,
    date: Optional[str] = None,
    address: Optional[str] = None,
    total: Optional[float] = None,
    stem: Optional[str] = None,
    sroie_root: Optional[Path] = None,
) -> Dict[str, Any]:
    """
    Salin gambar struk ke ``<sroie_root>/img/`` dan buat ``entities/<stem>.txt`` JSON.

    Jika ``total`` tidak diisi, isi nanti lewat ``parse_receipt`` (prediksi model).
    """
    image_path = Path(image_path)
    if not image_path.is_file():
        raise FileNotFoundError(image_path)

    if sroie_root is not None:
        root = Path(sroie_root)
    else:
        root = resolve_sroie_root()
    entities_dir = root / "entities"
    img_dir = root / "img"
    entities_dir.mkdir(parents=True, exist_ok=True)
    img_dir.mkdir(parents=True, exist_ok=True)

    stem = stem or f"user_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    dest_img = img_dir / f"{stem}.jpg"
    shutil.copy2(image_path, dest_img)

    entity = {
        "company": company or "",
        "date": date or datetime.now().strftime("%d-%m-%y"),
        "address": address or "",
        "total": str(total) if total is not None else "",
    }
    entity_path = entities_dir / f"{stem}.txt"
    entity_path.write_text(json.dumps(entity, ensure_ascii=False, indent=4), encoding="utf-8")

    return {
        "stem": stem,
        "image_path": str(dest_img.resolve()),
        "entity_path": str(entity_path.resolve()),
        "sroie_root": str(root.resolve()),
    }


def _entity_for_image(img_path: Path) -> Optional[Dict[str, Any]]:
    """Load entity from merged sources (prefer folder_entity_output)."""
    stem = normalize_stem(img_path.name)
    root = resolve_sroie_root()
    for folder in ("folder_entity_output", "entities"):
        entity_path = root / folder / f"{stem}.txt"
        if entity_path.is_file():
            try:
                raw = entity_path.read_text(encoding="utf-8", errors="replace")
                return json.loads(raw)
            except json.JSONDecodeError:
                continue
        for name in (root / folder).glob(f"{stem}*.txt") if (root / folder).is_dir() else []:
            try:
                raw = name.read_text(encoding="utf-8", errors="replace")
                return json.loads(raw)
            except json.JSONDecodeError:
                continue
    return None


def _total_from_box_stem(stem: str) -> Optional[float]:
    lines = load_box_lines_for_stem(stem)
    if not lines:
        return None
    return extract_total_from_box_lines(lines)


def parse_receipt(
    image_path: str | Path,
    *,
    use_trained_weights: bool = True,
    line_items_text: Optional[str] = None,
    volume_liter: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Hasil terstruktur untuk Model 2 (karbon) dan Model 3 (forecast).

    Prioritas total: entity JSON → box TOTAL regex → MobileNet.

    Returns keys: ``amount``, ``date``, ``merchant``, ``address``, ``image_path``,
    ``line_items_text``, ``source_total`` ('entity' | 'box' | 'model' | combinations).
    """
    image_path = Path(image_path)
    stem = normalize_stem(image_path.name)
    entity = _entity_for_image(image_path)

    amount: Optional[float] = None
    source_total = "unknown"
    merchant = ""
    date_val: Optional[pd.Timestamp] = None
    address = ""
    box_lines: List[str] = []

    if entity:
        merchant = str(entity.get("company") or "")
        address = str(entity.get("address") or "")
        raw_total = str(entity.get("total") or "").strip()
        if raw_total:
            cleaned = pd.Series([raw_total]).str.replace(r"[^\d\.]", "", regex=True)[0]
            amount = pd.to_numeric(cleaned, errors="coerce")
            if pd.notna(amount):
                amount = float(amount)
                source_total = "entity"
        if entity.get("date"):
            date_val = pd.to_datetime(entity["date"], errors="coerce", dayfirst=True)

    if amount is None:
        box_lines = load_box_lines_for_stem(stem)
        box_total = extract_total_from_box_lines(box_lines) if box_lines else None
        if box_total is not None:
            amount = float(box_total)
            source_total = "box"

    if amount is None and use_trained_weights:
        weights = repo_root() / "models" / "receipt_total" / "receipt_total_mobilenet.weights.h5"
        if weights.is_file():
            from ml.receipt_total_model import predict_total

            amount = predict_total(str(image_path))
            if source_total == "unknown":
                source_total = "model"
            else:
                source_total = f"{source_total}+model"

    if date_val is None or pd.isna(date_val):
        date_val = pd.Timestamp.now().normalize()

    if not line_items_text and box_lines:
        line_items_text = " ".join(box_lines[:20])

    fuel_hint = detect_fuel_text(line_items_text or "")
    if volume_liter is None and line_items_text:
        volume_liter = extract_volume_liter(line_items_text)

    out: Dict[str, Any] = {
        "amount": amount,
        "date": date_val.isoformat() if date_val is not None else None,
        "merchant": merchant,
        "address": address,
        "image_path": str(image_path.resolve()),
        "stem": stem,
        "line_items_text": line_items_text or "",
        "volume_liter": volume_liter,
        "fuel_class_hint": fuel_hint,
        "source_total": source_total,
    }
    return out


def append_transaction_to_history(
    transaction: Dict[str, Any],
    history: Optional[List[float]] = None,
    *,
    by_date: Optional[Dict[str, float]] = None,
) -> List[float]:
    """
    Tambahkan ``amount`` ke riwayat harian (untuk ``predict_horizon_total``).

    ``by_date``: opsional dict ``YYYY-MM-DD`` → total harian; jika None, hanya append scalar list.
    """
    amount = transaction.get("amount")
    if amount is None:
        return history or []
    history = list(history or [])
    history.append(float(amount))
    return history


def run_receipt_pipeline(
    image_path: str | Path,
    *,
    daily_totals_history: Optional[List[float]] = None,
    carbon_text: Optional[str] = None,
    volume_liter: Optional[float] = None,
    ingest: bool = False,
) -> Dict[str, Any]:
    """
    Satu panggilan: parse struk → (opsional) karbon → (opsional) forecast.

    ``carbon_text`` + ``volume_liter`` diperlukan untuk Model 2; jika kosong, coba deteksi dari box teks.
    """
    if ingest:
        meta = ingest_user_receipt(image_path)
        image_path = meta["image_path"]

    tx = parse_receipt(
        image_path,
        line_items_text=carbon_text,
        volume_liter=volume_liter,
    )

    auto_carbon_text = carbon_text or tx.get("line_items_text") or ""
    auto_volume = volume_liter if volume_liter is not None else tx.get("volume_liter")
    fuel_ok = classify_fuel_text(auto_carbon_text) is not None

    result: Dict[str, Any] = {"transaction": tx, "carbon": None, "forecast": None}

    if fuel_ok and auto_volume is not None:
        from ml.green_carbon_model import load_model_from_h5

        w = repo_root() / "models" / "green_carbon" / "green_eligibility_model.weights.h5"
        if w.is_file():
            model = load_model_from_h5(str(w))
            result["carbon"] = model.predict_and_evaluate(auto_carbon_text, float(auto_volume))

    history = append_transaction_to_history(tx, daily_totals_history)
    fw = repo_root() / "models" / "expense_forecast" / "expense_forecast.weights.h5"
    if fw.is_file() and len(history) >= 1:
        from ml.expense_forecast_model import predict_horizon_total

        try:
            result["forecast"] = predict_horizon_total(history)
            result["forecast"]["daily_totals_used"] = len(history)
        except Exception as exc:
            result["forecast_error"] = str(exc)

    return result


def build_ledger_from_sroie(export_csv: Optional[Path] = None) -> pd.Series:
    """Deret harian global dari entitas SROIE merged (untuk demo forecast)."""
    df_raw, _ = load_entities_merged()
    df_clean = clean_entities_df(df_raw)
    if export_csv:
        from ml.sroie_loader import build_ledger_from_entities

        ledger = build_ledger_from_entities(df_raw)
        ledger.to_csv(export_csv, index=False)
    daily = daily_global_spend_series(df_clean)
    return daily_series_filled(daily, fill_value=0.0)


def sroie_merge_report() -> Dict[str, object]:
    """Stats for notebooks / verify script."""
    stats = merge_stats_summary()
    _, pairs, lines, root = prepare_receipt_training_data()
    stats["training_pairs"] = len(pairs)
    stats["bbox_lines"] = len(lines)
    stats["sroie_root_resolved"] = str(root)
    return stats
