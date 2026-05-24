"""
Export trained Rekapin models to production ``.keras`` format (Main Quest #3).

Run after training weights exist:
    python -m ml.export_serving
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

from ml.sroie_loader import repo_root


@tf.keras.utils.register_keras_serializable(package="rekapin")
class InverseStandardScalerLayer(layers.Layer):
    """Denormalize regression head output: ``y_orig = y_scaled * scale + mean``."""

    def __init__(self, mean: float, scale: float, **kwargs):
        super().__init__(**kwargs)
        self.mean = float(mean)
        self.scale = float(scale)

    def call(self, inputs):
        scale = tf.maximum(tf.cast(self.scale, inputs.dtype), 1e-8)
        mean = tf.cast(self.mean, inputs.dtype)
        return tf.maximum(inputs * scale + mean, 0.0)

    def get_config(self):
        config = super().get_config()
        config.update({"mean": self.mean, "scale": self.scale})
        return config


def export_receipt_keras(
    output_dir: Optional[Path] = None,
    *,
    weights_name: str = "receipt_total_mobilenet.weights.h5",
    keras_name: str = "receipt_total_serving.keras",
) -> Path:
    """Wrap preprocess + backbone + inverse scaler into one ``.keras`` serving model."""
    from ml.receipt_total_model import IMG_SIZE, build_model

    output_dir = Path(output_dir or repo_root() / "models" / "receipt_total")
    config_path = output_dir / "receipt_total_config.json"
    weights_path = output_dir / weights_name
    keras_path = output_dir / keras_name

    if not weights_path.is_file():
        raise FileNotFoundError(f"Missing weights: {weights_path}")
    with open(config_path, encoding="utf-8") as f:
        cfg = json.load(f)
    mean = float(cfg["target_scaler"]["mean"])
    scale = float(cfg["target_scaler"]["scale"])

    inner = build_model()
    inner.load_weights(str(weights_path))

    inp = keras.Input(shape=IMG_SIZE + (3,), dtype=tf.float32, name="image_rgb_0_255")
    preprocessed = layers.Lambda(
        lambda x: keras.applications.mobilenet_v2.preprocess_input(x),
        name="mobilenet_preprocess",
    )(inp)
    scaled = inner(preprocessed)
    out = InverseStandardScalerLayer(mean=mean, scale=scale, name="total_original")(scaled)
    serving = keras.Model(inp, out, name="receipt_total_serving")
    serving.save(str(keras_path))
    print(f"[export] receipt -> {keras_path}")
    return keras_path


def export_forecast_keras(
    output_dir: Optional[Path] = None,
    *,
    weights_name: str = "expense_forecast.weights.h5",
    keras_name: str = "expense_forecast.keras",
) -> Path:
    from ml.expense_forecast_model import build_forecast_model

    output_dir = Path(output_dir or repo_root() / "models" / "expense_forecast")
    config_path = output_dir / "expense_forecast_config.json"
    weights_path = output_dir / weights_name
    keras_path = output_dir / keras_name

    if not weights_path.is_file():
        raise FileNotFoundError(f"Missing weights: {weights_path}")
    with open(config_path, encoding="utf-8") as f:
        cfg = json.load(f)
    window = int(cfg["window"])

    model = build_forecast_model(window)
    model.load_weights(str(weights_path))
    model.save(str(keras_path))
    print(f"[export] forecast -> {keras_path}")
    return keras_path


def export_carbon_keras(
    output_dir: Optional[Path] = None,
    *,
    weights_name: str = "green_eligibility_model.weights.h5",
    keras_name: str = "green_eligibility_model.keras",
) -> Path:
    from ml.green_carbon_model import load_model_from_h5

    output_dir = Path(output_dir or repo_root() / "models" / "green_carbon")
    weights_path = output_dir / weights_name
    keras_path = output_dir / keras_name

    if not weights_path.is_file():
        raise FileNotFoundError(f"Missing weights: {weights_path}")

    model = load_model_from_h5(str(weights_path))
    model.save(str(keras_path))
    print(f"[export] carbon -> {keras_path}")
    return keras_path


def export_all() -> Dict[str, str]:
    results: Dict[str, str] = {}
    for name, fn in (
        ("receipt", export_receipt_keras),
        ("forecast", export_forecast_keras),
        ("carbon", export_carbon_keras),
    ):
        try:
            path = fn()
            results[name] = str(path)
        except FileNotFoundError as exc:
            print(f"[export] skip {name}: {exc}")
        except Exception as exc:
            print(f"[export] failed {name}: {exc}")
    return results


if __name__ == "__main__":
    out = export_all()
    print("Export summary:", out)
