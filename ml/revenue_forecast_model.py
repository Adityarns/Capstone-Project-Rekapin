from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

from tensorflow import keras
from tensorflow.keras import layers

# ─── Konstanta ────────────────────────────────────────────────────────────────
WINDOW = 30
HORIZON = 30
NOTIFICATION_THRESHOLD = 0.05  

_DEFAULT_MODEL_DIR = Path(__file__).resolve().parent.parent / "models" / "revenue_forecast"


# 1. ARSITEKTUR MODEL 

def build_forecast_model(window: int = WINDOW) -> keras.Model:
    """Bangun arsitektur Bidirectional LSTM (Functional API). Identik dengan training."""
    inp = keras.Input(shape=(window, 4), name="history_window")

    x = layers.Bidirectional(
        layers.LSTM(128, return_sequences=True, name="lstm_1"), name="bilstm_1")(inp)
    x = layers.Dropout(0.2)(x)
    x = layers.Bidirectional(
        layers.LSTM(64, return_sequences=False, name="lstm_2"), name="bilstm_2")(x)
    x = layers.Dropout(0.2)(x)
    x = layers.Dense(64, activation="relu", name="dense_1")(x)
    x = layers.Dense(32, activation="relu", name="dense_2")(x)
    out = layers.Dense(1, activation="sigmoid", name="predicted_revenue")(x)

    return keras.Model(inp, out, name="revenue_forecast_umkm")

# 2. LOAD MODEL

def _load_model(model_dir: Optional[Path] = None) -> keras.Model:
    """Load .keras (prioritas) atau .weights.h5 (fallback)."""
    model_dir = model_dir or _DEFAULT_MODEL_DIR
    keras_path = model_dir / "revenue_forecast.keras"
    weights_path = model_dir / "revenue_forecast.weights.h5"

    if keras_path.exists():
        return keras.models.load_model(str(keras_path))

    if weights_path.exists():
        model = build_forecast_model()
        model.load_weights(str(weights_path))
        return model

    raise FileNotFoundError(
        f"Model tidak ditemukan di {model_dir}.\n"
        "Pastikan revenue_forecast.weights.h5 atau revenue_forecast.keras ada.\n"
        "Download dari Google Drive setelah training di Colab."
    )

# 3. PREPROCESSING 

def _preprocess_window(daily_revenue: List[float]) -> tuple:
    """List revenue harian -> tensor (1,30,4) + (w_min, span) untuk inverse."""
    arr = np.array(daily_revenue, dtype=np.float32)

    if len(arr) >= WINDOW:
        arr = arr[-WINDOW:]
    else:
        arr = np.pad(arr, (WINDOW - len(arr), 0), mode="edge")

    w_min = float(arr.min())
    w_max = float(arr.max())
    span = max(w_max - w_min, 1.0)
    rev_norm = (arr - w_min) / span

    weekday = np.array([i % 7 / 6.0 for i in range(WINDOW)], dtype=np.float32)
    monthday = np.array([i % 30 / 29.0 for i in range(WINDOW)], dtype=np.float32)

    trend_val = float(rev_norm[-7:].mean()) / (float(rev_norm[:7].mean()) + 1e-8)
    trend_val = min(trend_val / 2.0, 1.0)
    w_trend = np.full(WINDOW, trend_val, dtype=np.float32)

    x = np.stack([rev_norm, weekday, monthday, w_trend], axis=1)
    return x.reshape(1, WINDOW, 4).astype(np.float32), w_min, span


# 4. FUNGSI PREDIKSI UTAMA 

def predict_revenue_horizon(
    daily_revenue: List[float],
    model_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    """
    Prediksi total pendapatan 30 hari ke depan.

    Dipanggil oleh api/main.py:
        from ml.revenue_forecast_model import predict_revenue_horizon
        return predict_revenue_horizon(body.daily_revenue)

    Parameters
    ----------
    daily_revenue : list of float
        Pendapatan harian (Rupiah), idealnya 30 hari terakhir.

    Returns
    -------
    dict:
        predicted_revenue_next_horizon : float  — prediksi total 30 hari (Rupiah)
        predicted_daily_avg            : float  — rata-rata harian prediksi (Rupiah)
        horizon_days, window_days, confidence_note
    """
    model = _load_model(model_dir)
    x, w_min, span = _preprocess_window(daily_revenue)

    y_pred_norm = float(model.predict(x, verbose=0)[0, 0])
    y_pred_norm = float(np.clip(y_pred_norm, 0.0, 1.0))

    avg_daily_pred = y_pred_norm * span + w_min
    total_30d = avg_daily_pred * HORIZON

    return {
        "predicted_revenue_next_horizon": round(max(0.0, total_30d), 2),
        "predicted_daily_avg": round(max(0.0, avg_daily_pred), 2),
        "horizon_days": HORIZON,
        "window_days": WINDOW,
        "confidence_note": "Prediksi berbasis pola 30 hari terakhir",
    }

# 5. FUNGSI NOTIFIKASI PENDAPATAN

def generate_revenue_notifications(
    current_month_revenue: float,
    previous_month_revenue: float,
    threshold: float = NOTIFICATION_THRESHOLD,
) -> List[Dict[str, Any]]:
    """
    Hasilkan notifikasi berdasarkan perubahan pendapatan.

    Parameters
    ----------
    current_month_revenue  : Total pendapatan bulan ini (Rupiah)
    previous_month_revenue : Total pendapatan bulan lalu (Rupiah)
    threshold              : Ambang batas % (default 5%)

    Returns
    -------
    list of dict berisi type, message, pct, current_rp, previous_rp
    """
    notifications = []

    if previous_month_revenue > 0:
        revenue_pct = (current_month_revenue - previous_month_revenue) / previous_month_revenue

        if revenue_pct >= threshold:
            pct_display = round(abs(revenue_pct) * 100, 1)
            notifications.append({
                "type": "revenue_increase",
                "message": f"Pendapatan kamu meningkat bulan ini sebesar {pct_display}%",
                "pct": pct_display,
                "current_rp": current_month_revenue,
                "previous_rp": previous_month_revenue,
            })

        elif revenue_pct <= -threshold:
            pct_display = round(abs(revenue_pct) * 100, 1)
            notifications.append({
                "type": "revenue_decrease",
                "message": f"Pendapatan kamu menurun bulan ini sebesar {pct_display}%",
                "pct": pct_display,
                "current_rp": current_month_revenue,
                "previous_rp": previous_month_revenue,
            })

    return notifications

# 6. ENTRY POINT 

if __name__ == "__main__":
    print("=" * 55)
    print("  TEST revenue_forecast_model.py")
    print("=" * 55)

    print("\n[1] Test notifikasi pendapatan:")
    notifs = generate_revenue_notifications(
        current_month_revenue=1_050_000,
        previous_month_revenue=1_000_000,
    )
    for n in notifs:
        print(f"    [{n['type']}] {n['message']}")

    print("\n[2] Test prediksi revenue:")
    try:
        import random
        random.seed(42)
        daily_data = [random.uniform(800_000, 1_200_000) for _ in range(30)]
        result = predict_revenue_horizon(daily_data)
        print(f"    Input  : 30 hari data revenue (simulasi)")
        print(f"    Output : Rp {result['predicted_revenue_next_horizon']:,.0f} (total 30 hari)")
        print(f"    Avg/hr : Rp {result['predicted_daily_avg']:,.0f}")
        print(f"    ✅ Model berjalan dengan baik!")
    except FileNotFoundError as e:
        print(f"    ⚠️  Model belum ada: {e}")
