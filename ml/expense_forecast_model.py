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
WINDOW = 30                    # Jumlah hari input (harus sama dengan training)
HORIZON = 30                   # Jumlah hari prediksi ke depan
NOTIFICATION_THRESHOLD = 0.10  # 10% threshold notifikasi

# Path default model (relatif terhadap root repo)
_DEFAULT_MODEL_DIR = Path(__file__).resolve().parent.parent / "models" / "expense_forecast"


# ═══════════════════════════════════════════════════════════════════════════════
# 1. ARSITEKTUR MODEL
#    Harus IDENTIK dengan arsitektur di training_fixed.ipynb Sel 6
# ═══════════════════════════════════════════════════════════════════════════════

def build_forecast_model(window: int = WINDOW) -> keras.Model:
    """
    Bangun arsitektur Bidirectional LSTM dengan Functional API.
    Harus identik dengan Sel 6 di expense_forecast_training_fixed.ipynb.
    Digunakan saat load_weights (fallback jika .keras tidak tersedia).
    """
    inp = keras.Input(shape=(window, 4), name="history_window")

    x = layers.Bidirectional(
        layers.LSTM(128, return_sequences=True, name="lstm_1"),
        name="bilstm_1"
    )(inp)
    x = layers.Dropout(0.2)(x)

    x = layers.Bidirectional(
        layers.LSTM(64, return_sequences=False, name="lstm_2"),
        name="bilstm_2"
    )(x)
    x = layers.Dropout(0.2)(x)

    x = layers.Dense(64, activation="relu", name="dense_1")(x)
    x = layers.Dense(32, activation="relu", name="dense_2")(x)

    # sigmoid: output [0,1] konsisten dengan target normalized training
    out = layers.Dense(1, activation="sigmoid", name="predicted_spend")(x)

    return keras.Model(inp, out, name="expense_forecast_umkm")


# ═══════════════════════════════════════════════════════════════════════════════
# 2. LOAD MODEL
# ═══════════════════════════════════════════════════════════════════════════════

def _load_model(model_dir: Optional[Path] = None) -> keras.Model:
    """
    Load model dari file .keras (prioritas) atau .weights.h5 (fallback).

    Urutan:
    1. Coba load expense_forecast.keras  (SavedModel lengkap)
    2. Fallback: build arsitektur + load expense_forecast.weights.h5
    """
    model_dir = model_dir or _DEFAULT_MODEL_DIR
    keras_path = model_dir / "expense_forecast.keras"
    weights_path = model_dir / "expense_forecast.weights.h5"

    if keras_path.exists():
        return keras.models.load_model(str(keras_path))

    if weights_path.exists():
        model = build_forecast_model()
        model.load_weights(str(weights_path))
        return model

    raise FileNotFoundError(
        f"Model tidak ditemukan di {model_dir}.\n"
        "Pastikan file berikut ada:\n"
        "  - models/expense_forecast/expense_forecast.keras\n"
        "Download dari Google Drive setelah training di Colab selesai."
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 3. PREPROCESSING INPUT
#    Logika ini HARUS konsisten dengan make_windows() di training_fixed
# ═══════════════════════════════════════════════════════════════════════════════

def _preprocess_window(daily_expenses: List[float]) -> tuple:
    """
    Ubah list pengeluaran harian menjadi input tensor untuk model.

    Konsisten dengan Sel 5 training_fixed (make_windows):
    - Normalisasi MinMax menggunakan min/max dari window itu sendiri
    - 4 fitur: [spend_norm, weekday_norm, monthday_norm, trend_norm]

    Returns: (tensor shape (1,30,4), w_min, span) untuk inverse transform
    """
    arr = np.array(daily_expenses, dtype=np.float32)

    # Ambil 30 hari terakhir, atau pad kiri jika kurang dari 30
    if len(arr) >= WINDOW:
        arr = arr[-WINDOW:]
    else:
        arr = np.pad(arr, (WINDOW - len(arr), 0), mode="edge")

    # Normalisasi MinMax per-window (sama dengan training)
    w_min = float(arr.min())
    w_max = float(arr.max())
    span = max(w_max - w_min, 1.0)
    spend_norm = (arr - w_min) / span

    # Fitur weekday dinormalisasi ke [0,1]
    weekday = np.array([i % 7 / 6.0 for i in range(WINDOW)], dtype=np.float32)

    # Fitur hari dalam bulan dinormalisasi ke [0,1]
    monthday = np.array([i % 30 / 29.0 for i in range(WINDOW)], dtype=np.float32)

    # Fitur tren: ratio 7 hari terakhir vs 7 hari awal window
    trend_val = float(spend_norm[-7:].mean()) / (float(spend_norm[:7].mean()) + 1e-8)
    trend_val = min(trend_val / 2.0, 1.0)
    w_trend = np.full(WINDOW, trend_val, dtype=np.float32)

    x = np.stack([spend_norm, weekday, monthday, w_trend], axis=1)
    return x.reshape(1, WINDOW, 4).astype(np.float32), w_min, span


# ═══════════════════════════════════════════════════════════════════════════════
# 4. FUNGSI PREDIKSI UTAMA
#    Dipanggil oleh api/main.py pada endpoint POST /ml/forecast
# ═══════════════════════════════════════════════════════════════════════════════

def predict_horizon_total(
    daily_totals: List[float],
    model_dir: Optional[Path] = None,
) -> Dict[str, Any]:
    """
    Prediksi total pengeluaran 30 hari ke depan.

    Dipanggil oleh api/main.py:
        from ml.expense_forecast_model import predict_horizon_total
        return predict_horizon_total(body.daily_totals)

    Parameters
    ----------
    daily_totals : list of float
        Pengeluaran harian (Rupiah), minimal 1 hari (akan di-pad otomatis).
        Idealnya 30 hari terakhir untuk hasil terbaik.
        Contoh: [450000, 520000, 480000, 550000, ...]

    Returns
    -------
    dict:
        predicted_spend_next_horizon : float  — prediksi total 30 hari (Rupiah)
        predicted_daily_avg          : float  — rata-rata harian prediksi (Rupiah)
        horizon_days                 : int    — 30
        window_days                  : int    — 30
        confidence_note              : str    — catatan akurasi
    """
    model = _load_model(model_dir)

    # Preprocessing: list → tensor (1, 30, 4) + simpan w_min & span untuk inverse
    x, w_min, span = _preprocess_window(daily_totals)

    # Inferensi
    y_pred_norm = float(model.predict(x, verbose=0)[0, 0])
    y_pred_norm = float(np.clip(y_pred_norm, 0.0, 1.0))

    # Inverse transform: normalized → Rupiah
    # Konsisten dengan training: target = avg_normalized_spend
    # avg_daily = y_pred_norm * span + w_min
    avg_daily_pred = y_pred_norm * span + w_min
    total_30d = avg_daily_pred * HORIZON

    return {
        "predicted_spend_next_horizon": round(max(0.0, total_30d), 2),
        "predicted_daily_avg": round(max(0.0, avg_daily_pred), 2),
        "horizon_days": HORIZON,
        "window_days": WINDOW,
        "confidence_note": "Prediksi berbasis pola 30 hari terakhir",
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 5. FUNGSI NOTIFIKASI
#    Dipanggil oleh backend untuk menghasilkan notifikasi UMKM
# ═══════════════════════════════════════════════════════════════════════════════

def generate_notifications(
    current_month_total: float,
    previous_month_total: float,
    current_month_income: Optional[float] = None,
    previous_month_income: Optional[float] = None,
    threshold: float = NOTIFICATION_THRESHOLD,
) -> List[Dict[str, Any]]:
    """
    Hasilkan notifikasi berdasarkan perubahan pengeluaran & pendapatan.

    Parameters
    ----------
    current_month_total   : Total pengeluaran bulan ini (Rupiah)
    previous_month_total  : Total pengeluaran bulan lalu (Rupiah)
    current_month_income  : Total pendapatan bulan ini (opsional)
    previous_month_income : Total pendapatan bulan lalu (opsional)
    threshold             : Ambang batas % untuk notifikasi (default 10%)

    Returns
    -------
    list of dict berisi type, message, pct, current_rp, previous_rp
    """
    notifications = []

    # ── Notifikasi Pengeluaran ──────────────────────────────────────────────
    if previous_month_total > 0:
        expense_pct = (current_month_total - previous_month_total) / previous_month_total

        if expense_pct >= threshold:
            pct_display = round(abs(expense_pct) * 100, 1)
            notifications.append({
                "type": "expense_increase",
                "message": f"Pengeluaran telah meningkat {pct_display}%, segera lakukan evaluasi",
                "pct": pct_display,
                "current_rp": current_month_total,
                "previous_rp": previous_month_total,
            })

        elif expense_pct <= -threshold:
            pct_display = round(abs(expense_pct) * 100, 1)
            notifications.append({
                "type": "expense_decrease",
                "message": f"Pengeluaran menurun sebesar {pct_display}%, lanjutkan",
                "pct": pct_display,
                "current_rp": current_month_total,
                "previous_rp": previous_month_total,
            })

    # ── Notifikasi Pendapatan ───────────────────────────────────────────────
    if current_month_income is not None and previous_month_income is not None:
        if previous_month_income > 0:
            income_pct = (current_month_income - previous_month_income) / previous_month_income

            if income_pct >= threshold:
                pct_display = round(abs(income_pct) * 100, 1)
                notifications.append({
                    "type": "income_increase",
                    "message": f"Pendapatan kamu meningkat bulan ini sebesar {pct_display}%",
                    "pct": pct_display,
                    "current_rp": current_month_income,
                    "previous_rp": previous_month_income,
                })

            elif income_pct <= -threshold:
                pct_display = round(abs(income_pct) * 100, 1)
                notifications.append({
                    "type": "income_decrease",
                    "message": f"Pendapatan kamu menurun bulan ini sebesar {pct_display}%",
                    "pct": pct_display,
                    "current_rp": current_month_income,
                    "previous_rp": previous_month_income,
                })

    return notifications


# ═══════════════════════════════════════════════════════════════════════════════
# 6. ENTRY POINT — test langsung via terminal
#    Jalankan: python -m ml.expense_forecast_model
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 55)
    print("  TEST expense_forecast_model.py")
    print("=" * 55)

    # Test 1: Notifikasi (tidak butuh file .keras)
    print("\n[1] Test notifikasi — April → Mei:")
    notifs = generate_notifications(
        current_month_total=550_000,
        previous_month_total=500_000,
        current_month_income=1_050_000,
        previous_month_income=1_000_000,
    )
    for n in notifs:
        print(f"    [{n['type']}] {n['message']}")

    # Test 2: Prediksi (butuh file .keras)
    print("\n[2] Test prediksi:")
    try:
        import random
        random.seed(42)
        daily_data = [random.uniform(400_000, 600_000) for _ in range(30)]
        result = predict_horizon_total(daily_data)
        print(f"    Input  : 30 hari data harian (simulasi)")
        print(f"    Output : Rp {result['predicted_spend_next_horizon']:,.0f} (total 30 hari)")
        print(f"    Avg/hr : Rp {result['predicted_daily_avg']:,.0f}")
        print(f"    ✅ Model berjalan dengan baik!")
    except FileNotFoundError as e:
        print(f"    ⚠️  Model belum ada: {e}")
        print("    Download expense_forecast.keras dari Google Drive")
        print("    lalu letakkan di models/expense_forecast/")
