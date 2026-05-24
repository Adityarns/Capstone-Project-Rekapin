"""
Metrik evaluasi konsisten untuk model regresi dan klasifikasi Rekapin.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)


def regression_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    *,
    unit_label: str = "currency",
) -> Dict[str, Any]:
    """
    Metrik utama regresi (struk total, forecast horizon).

    MAE = rata-rata selisih absolut (mudah diinterpretasi).
    RMSE = penalti error besar lebih kuat.
    MAPE = error relatif (%); hati-hati jika y_true mendekati 0.
    R2 = proporsi varians yang dijelaskan (1 = sempurna).
    """
    y_true = np.asarray(y_true, dtype=np.float64).ravel()
    y_pred = np.asarray(y_pred, dtype=np.float64).ravel()
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mask = np.abs(y_true) > 1e-6
    if mask.any():
        mape = float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100.0)
    else:
        mape = None
    r2 = float(r2_score(y_true, y_pred)) if len(y_true) > 1 else None
    return {
        "task": "regression",
        "unit": unit_label,
        "n_samples": int(len(y_true)),
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "mape_percent": round(mape, 4) if mape is not None else None,
        "r2": round(r2, 4) if r2 is not None else None,
    }


def classification_metrics(
    y_true_idx: np.ndarray,
    y_pred_idx: np.ndarray,
    class_labels: list,
) -> Dict[str, Any]:
    """
    Metrik klasifikasi (model karbon / jenis BBM).

    Accuracy cocok untuk kelas seimbang; macro F1 lebih adil jika kelas jarang.
    """
    y_true_idx = np.asarray(y_true_idx).ravel()
    y_pred_idx = np.asarray(y_pred_idx).ravel()
    labels = list(range(len(class_labels)))
    return {
        "task": "classification",
        "n_samples": int(len(y_true_idx)),
        "accuracy": round(float(accuracy_score(y_true_idx, y_pred_idx)), 4),
        "precision_macro": round(
            float(precision_score(y_true_idx, y_pred_idx, average="macro", zero_division=0, labels=labels)),
            4,
        ),
        "recall_macro": round(
            float(recall_score(y_true_idx, y_pred_idx, average="macro", zero_division=0, labels=labels)),
            4,
        ),
        "f1_macro": round(
            float(f1_score(y_true_idx, y_pred_idx, average="macro", zero_division=0, labels=labels)),
            4,
        ),
        "f1_weighted": round(
            float(f1_score(y_true_idx, y_pred_idx, average="weighted", zero_division=0, labels=labels)),
            4,
        ),
        "per_class": classification_report(
            y_true_idx,
            y_pred_idx,
            labels=labels,
            target_names=class_labels,
            zero_division=0,
            output_dict=True,
        ),
    }


def print_regression_report(name: str, metrics: Dict[str, Any]) -> None:
    print(f"\n{'=' * 60}")
    print(f"  Evaluasi — {name} (regresi)")
    print(f"{'=' * 60}")
    print(f"  Sampel validasi : {metrics['n_samples']}")
    print(f"  MAE             : {metrics['mae']} ({metrics.get('unit', '')})")
    print(f"  RMSE            : {metrics['rmse']}")
    if metrics.get("mape_percent") is not None:
        print(f"  MAPE            : {metrics['mape_percent']}%")
    if metrics.get("r2") is not None:
        print(f"  R²              : {metrics['r2']}")


def strip_for_json(obj: Any) -> Any:
    """Hapus ``per_class`` (besar) saat menyimpan ke JSON; simpan ringkasan saja."""
    if isinstance(obj, dict):
        return {
            k: strip_for_json(v)
            for k, v in obj.items()
            if k != "per_class"
        }
    return obj


def print_classification_report_block(name: str, metrics: Dict[str, Any]) -> None:
    print(f"\n{'=' * 60}")
    print(f"  Evaluasi — {name} (klasifikasi BBM)")
    print(f"{'=' * 60}")
    print(f"  Sampel          : {metrics['n_samples']}")
    print(f"  Accuracy        : {metrics['accuracy']:.2%}")
    print(f"  Precision (macro): {metrics['precision_macro']:.4f}")
    print(f"  Recall (macro)  : {metrics['recall_macro']:.4f}")
    print(f"  F1 (macro)      : {metrics['f1_macro']:.4f}")
    print(f"  F1 (weighted)   : {metrics['f1_weighted']:.4f}")
