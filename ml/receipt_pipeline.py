"""
End-to-end receipt flow for Rekapin:

  struk (gambar) → structured transaction → ledger / forecast + carbon (jika teks BBM)

Hybrid ``parse_receipt``: entity JSON → box SROIE → EasyOCR → MobileNet regression.
"""

from __future__ import annotations

import json
import re
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

_ITEM_LINE_RE = re.compile(
    r"^(?P<name>[A-Za-z0-9\-\s\.\&\/]{2,}?)\s+(?:(?P<qty>\d+)\s*[xX])?\s*(?P<price>\d+(?:\.\d{1,2})?)$"
)
_CATEGORY_KEYWORDS = {
    "fuel": ("pertalite", "pertamax", "ron90", "ron 90", "ron92", "ron 92", "ron95", "ron 95", "spbu", "petrol"),
    "groceries": ("mart", "grocery", "supermarket", "milk", "bread", "rice", "sugar", "egg", "buah", "sayur"),
    "food": (
        "restaurant",
        "cafe",
        "coffee",
        "tea",
        "meal",
        "nasi",
        "makan",
        "ayam",
        "burger",
        "pizza",
        "chicken",
        "chop",
        "lemon",
        "rootbeer",
        "peanut",
    ),
    "health": ("pharmacy", "apotek", "clinic", "hospital", "medicine", "vitamin"),
    "transport": ("taxi", "bus", "train", "tol", "parking", "grab", "gojek"),
}


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
    ocr_item_top_ratio: float = 0.30,
    ocr_item_bottom_ratio: float = 0.74,
    ocr_total_top_ratio: float = 0.55,
    ocr_total_bottom_ratio: float = 0.96,
) -> Dict[str, Any]:
    """
    Hasil terstruktur untuk Model 2 (karbon) dan Model 3 (forecast).

    Prioritas total: entity JSON → box SROIE → EasyOCR → MobileNet.

    Returns keys: ``amount``, ``currency`` (``MYR`` | ``IDR``), ``date``, ``merchant``,
    ``line_items_text``, ``source_total`` ('entity' | 'box' | 'ocr' | 'model').

    MobileNet hanya untuk MYR (latihan SROIE). Struk IDR memakai OCR/regex; model dilewati.
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
    ocr_lines: List[str] = []
    ocr_confidence: Optional[float] = None
    currency: Optional[str] = None

    if entity:
        merchant = str(entity.get("company") or "")
        address = str(entity.get("address") or "")
        raw_total = str(entity.get("total") or "").strip()
        if raw_total:
            from ml.receipt_currency import detect_currency_from_text, parse_money_amount

            hint = detect_currency_from_text(
                f"{raw_total} {merchant} {address} {entity.get('company', '')}"
            )
            parsed = parse_money_amount(raw_total, hint)
            if parsed is not None:
                amount = float(parsed)
                source_total = "entity"
                if hint:
                    currency = hint
        if entity.get("date"):
            date_val = pd.to_datetime(entity["date"], errors="coerce", dayfirst=True)

    if amount is None:
        box_lines = load_box_lines_for_stem(stem)
        if box_lines and currency is None:
            from ml.receipt_currency import detect_currency_from_lines

            currency = detect_currency_from_lines(box_lines)
        box_total = extract_total_from_box_lines(box_lines, currency) if box_lines else None
        if box_total is not None:
            amount = float(box_total)
            source_total = "box"

    if amount is None:
        from ml.receipt_ocr import (
            extract_date_from_lines,
            extract_merchant_from_lines,
            last_ocr_confidence,
            lines_to_line_items_text,
            ocr_receipt_lines,
            ocr_receipt_sections,
        )

        sections = ocr_receipt_sections(
            image_path,
            item_top_ratio=ocr_item_top_ratio,
            item_bottom_ratio=ocr_item_bottom_ratio,
            total_top_ratio=ocr_total_top_ratio,
            total_bottom_ratio=ocr_total_bottom_ratio,
        )
        ocr_lines = sections.get("full", []) or ocr_receipt_lines(image_path)
        ocr_item_lines = sections.get("items", [])
        ocr_total_lines = sections.get("totals", [])
        ocr_confidence = last_ocr_confidence()
        if ocr_lines:
            from ml.receipt_currency import detect_currency_from_lines

            if currency is None:
                currency = detect_currency_from_lines(ocr_lines)
            total_candidates = ocr_total_lines or ocr_lines
            ocr_total = extract_total_from_box_lines(total_candidates, currency)
            if ocr_total is None and total_candidates is not ocr_lines:
                # fallback to full OCR lines if totals crop misses the block
                ocr_total = extract_total_from_box_lines(ocr_lines, currency)
            if ocr_total is not None:
                amount = float(ocr_total)
                source_total = "ocr"
            if not merchant:
                merchant = extract_merchant_from_lines(ocr_lines)
            if date_val is None or pd.isna(date_val):
                ocr_date = extract_date_from_lines(ocr_lines)
                if ocr_date is not None and pd.notna(ocr_date):
                    date_val = ocr_date
            if not line_items_text:
                item_lines = ocr_item_lines or ocr_lines
                line_items_text = lines_to_line_items_text(item_lines, currency)
            if not box_lines:
                box_lines = ocr_lines

    all_lines = box_lines or ocr_lines
    if currency is None and all_lines:
        from ml.receipt_currency import detect_currency_from_lines

        currency = detect_currency_from_lines(all_lines)

    from ml.receipt_currency import CURRENCY_IDR, CURRENCY_MYR

    if currency is None:
        currency = CURRENCY_MYR

    # Model dilatih SROIE (MYR); jangan dipakai untuk struk Rupiah
    use_model = use_trained_weights and currency != CURRENCY_IDR

    if amount is None and use_model:
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
        "ocr_confidence": ocr_confidence,
        "currency": currency,
    }
    return out


def _parse_description_items_from_text(
    text: str,
    currency: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Best-effort parser for receipt line items from OCR text."""
    if not text:
        return []
    lines = [ln.strip() for ln in re.split(r"[;\n\r]+", text) if ln.strip()]
    out: List[Dict[str, Any]] = []

    for ln in lines:
        from ml.receipt_ocr import _normalize_ocr_item_line
        from ml.receipt_currency import CURRENCY_IDR, parse_money_amount

        cleaned = _normalize_ocr_item_line(ln, currency)
        m = _ITEM_LINE_RE.match(cleaned)
        if not m:
            tail = re.search(
                r"(?:Rp\.?\s*)?(?P<price>[\d.,]+)\s*$" if currency == CURRENCY_IDR else r"(?P<price>\d+(?:\.\d{1,2}))\s*$",
                cleaned,
                re.I,
            )
            if tail:
                name = cleaned[: tail.start()].strip(" -:")
                if name:
                    price = parse_money_amount(tail.group("price"), currency) or float(
                        tail.group("price").replace(",", "")
                    )
                    out.append({"name": name, "qty": 1, "price": float(price)})
            continue
        name = m.group("name").strip(" -:")
        qty = int(m.group("qty")) if m.group("qty") else 1
        price = float(m.group("price"))
        out.append({"name": name, "qty": qty, "price": price})
    return out


def _suggest_category(text: str, merchant: str, fuel_hint: Optional[str]) -> str:
    corpus = f"{merchant} {text}".lower()
    if fuel_hint:
        return "fuel"
    for category, words in _CATEGORY_KEYWORDS.items():
        if any(w in corpus for w in words):
            return category
    return "others"


def build_receipt_history_payload(tx: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert parsed receipt to domain payload expected by website storage.

    Fields:
      title, amount, transaction_date, category_suggestion, transaction_type, description
    """
    raw_text = str(tx.get("line_items_text") or "").strip()
    currency = tx.get("currency") or "MYR"
    description_items = _parse_description_items_from_text(raw_text, currency)
    date_iso = tx.get("date")
    if date_iso:
        try:
            date_iso = pd.to_datetime(date_iso).strftime("%Y-%m-%d")
        except Exception:
            date_iso = str(date_iso)[:10]
    else:
        date_iso = pd.Timestamp.now().strftime("%Y-%m-%d")
    category = _suggest_category(
        raw_text,
        str(tx.get("merchant") or ""),
        tx.get("fuel_class_hint"),
    )
    return {
        "title": str(tx.get("merchant") or "").strip() or "Unknown Merchant",
        "amount": float(tx.get("amount")) if tx.get("amount") is not None else None,
        "currency": currency,
        "transaction_date": date_iso,
        "category_suggestion": category,
        "transaction_type": "expense",
        "description": {
            "description_text": raw_text,
            "description_items": description_items,
        },
    }


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
