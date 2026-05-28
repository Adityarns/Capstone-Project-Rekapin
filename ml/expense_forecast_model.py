"""
Daily spend forecasting with TensorFlow Functional API (LSTM).
Trains on SROIE-derived global daily totals; optional light synthetic jitter if series is short.
Exports weights + JSON scaler (MinMax) for API denormalization.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sklearn.preprocessing import MinMaxScaler
from tensorflow import keras
from tensorflow.keras import layers

from ml.metrics import print_regression_report, regression_metrics
from ml.sroie_loader import (
    clean_entities_df,
    daily_global_spend_series,
    daily_series_filled,
    load_entities_merged,
    repo_root,
)

WINDOW_DEFAULT = 14
HORIZON_DEFAULT = 7
SYNTH_MIN_LEN = 120


def naive_baseline_predict(
    scaled: np.ndarray,
    original: np.ndarray,
    window: int,
    horizon: int,
) -> np.ndarray:
    """Naive baseline: sum of last 7 days in window, repeated for each horizon day."""
    preds = []
    lookback = min(7, window)
    for i in range(0, len(scaled) - window - horizon + 1):
        recent = original[i + window - lookback : i + window]
        daily_avg = float(np.mean(recent)) if len(recent) else 0.0
        preds.append(daily_avg * horizon)
    return np.array(preds, dtype=np.float32)


def build_daily_series_from_sroie() -> np.ndarray:
    df_raw, stats = load_entities_merged()
    print(f"[forecast] merged entities: {stats.get('merged_unique_stems')}")
    df_clean = clean_entities_df(df_raw)
    daily = daily_global_spend_series(df_clean)
    filled = daily_series_filled(daily, fill_value=0.0)
    print(f"[forecast] daily series length (filled): {len(filled)}")
    return filled.values.astype(np.float32)


def augment_series_if_short(
    series: np.ndarray,
    min_len: int = SYNTH_MIN_LEN,
    noise_std: float = 0.03,
    seed: int = 42,
) -> Tuple[np.ndarray, bool]:
    """
    If ``series`` has fewer than ``min_len`` points, repeat with multiplicative
    Gaussian noise (demo only — document in reports). Returns (values, used_synthetic).
    """
    rng = np.random.default_rng(seed)
    s = np.maximum(series.astype(np.float32), 0.0)
    if len(s) >= min_len:
        return s, False
    reps = int(np.ceil(min_len / max(len(s), 1)))
    tiled = np.tile(s, reps)[: min_len * 2]
    noise = 1.0 + rng.normal(0, noise_std, size=tiled.shape).astype(np.float32)
    aug = np.maximum(tiled * noise, 0.0)
    return aug.astype(np.float32), True


def make_windows(
    scaled: np.ndarray,
    original: np.ndarray,
    window: int,
    horizon: int,
) -> Tuple[np.ndarray, np.ndarray]:
    """X from scaled history; y = sum of **original** spend over next ``horizon`` days."""
    if len(scaled) != len(original):
        raise ValueError("scaled and original must align")
    xs, ys = [], []
    for i in range(0, len(scaled) - window - horizon + 1):
        w = scaled[i : i + window]
        future = original[i + window : i + window + horizon]
        xs.append(w)
        ys.append(float(future.sum()))
    if not xs:
        raise ValueError("Series too short for chosen window and horizon.")
    X = np.array(xs, dtype=np.float32)[..., np.newaxis]
    y = np.array(ys, dtype=np.float32).reshape(-1, 1)
    return X, y


def build_forecast_model(window: int, lstm_units: int = 64) -> keras.Model:
    """Functional API: LSTM stack predicting one scalar (total spend over horizon)."""
    inp = keras.Input(shape=(window, 1), name="history_window")
    x = layers.LSTM(lstm_units, return_sequences=False, name="lstm")(inp)
    x = layers.Dropout(0.2)(x)
    x = layers.Dense(32, activation="relu")(x)
    out = layers.Dense(1, name="predicted_spend_horizon")(x)
    return keras.Model(inp, out, name="expense_forecast_lstm")


def evaluate_forecast_model(
    model: keras.Model,
    X_va: np.ndarray,
    y_va_norm: np.ndarray,
    scaler_y: MinMaxScaler,
    y_va_raw: np.ndarray,
) -> Dict[str, Any]:
    """Metrik pada skala nominal (total pengeluaran horizon hari)."""
    y_pred_norm = model.predict(X_va, verbose=0).ravel()
    y_pred = np.array(
        [_inverse_minmax(float(v), float(scaler_y.data_min_[0]), float(scaler_y.data_max_[0])) for v in y_pred_norm]
    )
    return regression_metrics(y_va_raw.ravel(), y_pred, unit_label="horizon_total_spend")


def train_and_export(
    series: Optional[np.ndarray] = None,
    window: int = WINDOW_DEFAULT,
    horizon: int = HORIZON_DEFAULT,
    epochs: int = 80,
    val_fraction: float = 0.2,
    output_dir: Optional[Path] = None,
    verbose: int = 1,
) -> Tuple[keras.Model, Dict[str, MinMaxScaler], Path, Dict[str, Any]]:
    output_dir = output_dir or (repo_root() / "models" / "expense_forecast")
    output_dir.mkdir(parents=True, exist_ok=True)

    if series is None:
        series = build_daily_series_from_sroie()
    raw_len = len(series)
    series_orig, used_syn = augment_series_if_short(series)
    if used_syn and verbose:
        print(
            f"[expense_forecast] Raw series {raw_len}d < {SYNTH_MIN_LEN}: "
            "used synthetic augmentation for demo training."
        )
    elif verbose:
        print(
            f"[expense_forecast] Raw series {raw_len}d >= {SYNTH_MIN_LEN}: "
            "synthetic augmentation disabled."
        )

    scaler_x = MinMaxScaler(feature_range=(0, 1))
    scaled = scaler_x.fit_transform(series_orig.reshape(-1, 1)).ravel().astype(np.float32)

    X, y_raw = make_windows(scaled, series_orig.astype(np.float32), window, horizon)
    baseline_preds = naive_baseline_predict(scaled, series_orig.astype(np.float32), window, horizon)
    scaler_y = MinMaxScaler(feature_range=(0, 1))
    y = scaler_y.fit_transform(y_raw).astype(np.float32)

    n = len(X)
    n_val = max(1, int(n * val_fraction))
    X_tr, X_va = X[:-n_val], X[-n_val:]
    y_tr, y_va = y[:-n_val], y[-n_val:]
    y_va_raw = y_raw[-n_val:]

    model = build_forecast_model(window)
    model.compile(
        optimizer=keras.optimizers.Adam(1e-3),
        loss=keras.losses.Huber(),
        metrics=[keras.metrics.MeanAbsoluteError(name="mae_norm_y")],
    )
    model.fit(
        X_tr,
        y_tr,
        validation_data=(X_va, y_va),
        epochs=epochs,
        batch_size=max(4, min(32, len(X_tr))),
        verbose=verbose,
    )

    val_metrics = evaluate_forecast_model(model, X_va, y_va, scaler_y, y_va_raw)
    print_regression_report("Model Forecast (validasi LSTM)", val_metrics)

    baseline_va = baseline_preds[-n_val:]
    baseline_metrics = regression_metrics(
        y_va_raw.ravel(), baseline_va, unit_label="horizon_total_spend_naive"
    )
    print_regression_report("Baseline naif (rata-rata 7 hari)", baseline_metrics)
    beats_baseline = val_metrics.get("r2", -999) > baseline_metrics.get("r2", -999)
    if verbose:
        print(
            f"[forecast] LSTM beats naive baseline (R2): {beats_baseline} "
            f"(LSTM R2={val_metrics.get('r2')} vs naive R2={baseline_metrics.get('r2')})"
        )

    weights_path = output_dir / "expense_forecast.weights.h5"
    model.save_weights(weights_path)

    def _mm_dict(s: MinMaxScaler) -> Dict[str, float]:
        return {
            "data_min": float(s.data_min_[0]),
            "data_max": float(s.data_max_[0]),
        }

    cfg: Dict[str, Any] = {
        "window": window,
        "horizon_days": horizon,
        "target": "MinMax-normalized sum of original daily spend over next horizon_days",
        "scaler_x": _mm_dict(scaler_x),
        "scaler_y": _mm_dict(scaler_y),
        "used_synthetic_augmentation": used_syn,
        "raw_series_length_days": int(raw_len),
        "synthetic_disabled_threshold_days": SYNTH_MIN_LEN,
        "n_train_windows": int(len(X_tr)),
        "n_val_windows": int(len(X_va)),
        "validation_metrics": val_metrics,
        "baseline_naive_7d_metrics": baseline_metrics,
        "lstm_beats_naive_baseline_r2": beats_baseline,
        "primary_metric": "mae",
        "metric_notes": "Regresi total pengeluaran H hari ke depan; bandingkan dengan baseline rata-rata 7 hari.",
    }
    cfg_path = output_dir / "expense_forecast_config.json"
    with open(cfg_path, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)

    metrics_path = output_dir / "expense_forecast_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(val_metrics, f, indent=2, ensure_ascii=False)

    try:
        from ml.export_serving import export_forecast_keras

        export_forecast_keras(output_dir)
    except Exception as exc:
        if verbose:
            print(f"[forecast] .keras export skipped: {exc}")

    scalers = {"x": scaler_x, "y": scaler_y}
    return model, scalers, weights_path, val_metrics


def _inverse_minmax(v: float, data_min: float, data_max: float) -> float:
    span = max(data_max - data_min, 1e-8)
    return float(v * span + data_min)


def predict_horizon_total(
    recent_daily_totals: List[float],
    weights_path: Optional[Path] = None,
    config_path: Optional[Path] = None,
) -> Dict[str, Any]:
    """
    ``recent_daily_totals`` must have length >= ``window`` (last ``window`` days used; pad left with zeros).
    Returns predicted total spend (currency units) summed over ``horizon_days``.
    """
    root = repo_root()
    out = root / "models" / "expense_forecast"
    weights_path = weights_path or (out / "expense_forecast.weights.h5")
    config_path = config_path or (out / "expense_forecast_config.json")
    with open(config_path, encoding="utf-8") as f:
        cfg = json.load(f)
    window = int(cfg["window"])
    horizon = int(cfg["horizon_days"])
    sx = cfg["scaler_x"]
    sy = cfg["scaler_y"]
    span_x = max(float(sx["data_max"]) - float(sx["data_min"]), 1e-8)

    arr = np.array(recent_daily_totals[-window:], dtype=np.float32)
    if len(arr) < window:
        arr = np.pad(arr, (window - len(arr), 0), mode="constant", constant_values=0.0)
    scaled = (arr - float(sx["data_min"])) / span_x
    x = scaled.reshape(1, window, 1).astype(np.float32)

    model = build_forecast_model(window)
    model.load_weights(str(weights_path))
    y_norm = float(model.predict(x, verbose=0)[0, 0])
    pred_total = _inverse_minmax(y_norm, float(sy["data_min"]), float(sy["data_max"]))
    return {
        "predicted_spend_next_horizon": max(0.0, pred_total),
        "horizon_days": horizon,
        "window_days": window,
    }


if __name__ == "__main__":
    _, _, wp, metrics = train_and_export(epochs=40, verbose=1)
    print("Saved weights to", wp)
    print("Metrik: models/expense_forecast/expense_forecast_metrics.json")