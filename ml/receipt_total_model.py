"""
Baseline TensorFlow model: receipt image -> regression on ``total`` (SROIE).
MobileNetV2 backbone + small head; K-fold CV; in-memory images (small dataset).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sklearn.model_selection import KFold
from sklearn.preprocessing import StandardScaler
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.preprocessing.image import ImageDataGenerator

from ml.callbacks import ValMAEOriginalScaleCallback
from ml.metrics import print_regression_report, regression_metrics
from ml.sroie_loader import prepare_receipt_training_data, repo_root

IMG_SIZE = (224, 224)
PREPROCESS = keras.applications.mobilenet_v2.preprocess_input


def _predict_batch_original(
    model: keras.Model,
    X: np.ndarray,
    scaler: StandardScaler,
) -> np.ndarray:
    """Prediksi batch gambar; kembalikan total dalam skala asli (bukan ter-normalisasi)."""
    preds_scaled = model.predict(PREPROCESS(X), verbose=0).ravel()
    scale = max(float(scaler.scale_[0]), 1e-8)
    mean = float(scaler.mean_[0])
    return np.maximum(preds_scaled * scale + mean, 0.0)


def evaluate_receipt_model(
    model: keras.Model,
    X: np.ndarray,
    y_true_original: np.ndarray,
    scaler: StandardScaler,
) -> Dict[str, Any]:
    y_pred = _predict_batch_original(model, X, scaler)
    return regression_metrics(y_true_original, y_pred, unit_label="receipt_total")


def load_images_matrix(paths: np.ndarray) -> np.ndarray:
    """RGB images float32 in [0, 255] suitable for ``ImageDataGenerator``."""
    imgs = []
    for p in paths:
        img = keras.utils.load_img(str(p), target_size=IMG_SIZE)
        imgs.append(keras.utils.img_to_array(img))
    return np.stack(imgs, axis=0).astype(np.float32)


def _set_backbone_trainable(model: keras.Model, trainable: bool) -> None:
    """Toggle trainable flag on inlined MobileNet layers (before ``gap``)."""
    for layer in model.layers:
        if layer.name == "gap":
            break
        layer.trainable = trainable


def _unfreeze_backbone_tail(model: keras.Model, unfreeze_layers: int) -> None:
    """Unfreeze last N backbone layers before the GAP head."""
    backbone = []
    for layer in model.layers:
        if layer.name == "gap":
            break
        backbone.append(layer)
    n = min(unfreeze_layers, len(backbone))
    for layer in backbone[:-n]:
        layer.trainable = False
    for layer in backbone[-n:]:
        layer.trainable = True
    for layer in model.layers:
        if layer.name == "gap" or isinstance(layer, (layers.Dense, layers.Dropout)):
            layer.trainable = True


def build_model() -> keras.Model:
    inputs = keras.Input(shape=IMG_SIZE + (3,), name="image")
    base = keras.applications.MobileNetV2(
        include_top=False,
        weights="imagenet",
        input_tensor=inputs,
        pooling=None,
    )
    base.trainable = False
    x = layers.GlobalAveragePooling2D(name="gap")(base.output)
    x = layers.Dropout(0.25)(x)
    x = layers.Dense(64, activation="relu")(x)
    out = layers.Dense(1, name="total_scaled")(x)
    return keras.Model(inputs, out, name="receipt_total_mobilenet")


def train_kfold_cv(
    pairs_df,
    n_splits: int = 5,
    epochs: int = 8,
    batch_size: int = 16,
    verbose: int = 1,
) -> List[Dict[str, float]]:
    paths = pairs_df["image_path"].values
    totals = pairs_df["total"].values.astype(np.float32)
    X_all = load_images_matrix(paths)
    kf = KFold(n_splits=n_splits, shuffle=True, random_state=42)
    fold_metrics: List[Dict[str, float]] = []

    train_idg = ImageDataGenerator(
        preprocessing_function=PREPROCESS,
        horizontal_flip=True,
        brightness_range=(0.88, 1.12),
        zoom_range=0.05,
    )
    val_idg = ImageDataGenerator(preprocessing_function=PREPROCESS)

    for fold, (train_idx, val_idx) in enumerate(kf.split(np.arange(len(paths)))):
        scaler = StandardScaler()
        y_tr = scaler.fit_transform(totals[train_idx].reshape(-1, 1)).ravel()
        y_va = scaler.transform(totals[val_idx].reshape(-1, 1)).ravel()

        gen_tr = train_idg.flow(X_all[train_idx], y_tr, batch_size=batch_size, seed=42 + fold)
        gen_va = val_idg.flow(X_all[val_idx], y_va, batch_size=batch_size, shuffle=False)

        model = build_model()
        model.compile(
            optimizer=keras.optimizers.Adam(1e-3),
            loss=keras.losses.Huber(),
            metrics=[keras.metrics.MeanAbsoluteError(name="mae")],
        )
        steps_tr = max(1, int(np.ceil(len(train_idx) / batch_size)))
        steps_va = max(1, int(np.ceil(len(val_idx) / batch_size)))
        model.fit(
            gen_tr,
            validation_data=gen_va,
            steps_per_epoch=steps_tr,
            validation_steps=steps_va,
            epochs=epochs,
            verbose=verbose,
        )
        ev = model.evaluate(gen_va, steps=steps_va, verbose=0)
        reg = evaluate_receipt_model(
            model, X_all[val_idx], totals[val_idx], scaler
        )
        fold_metrics.append(
            {
                "fold": fold,
                "val_loss_scaled": float(ev[0]),
                "val_mae_scaled": float(ev[1]),
                **{k: reg[k] for k in ("mae", "rmse", "mape_percent", "r2")},
            }
        )
        print_regression_report(f"K-Fold {fold + 1}", reg)
        keras.backend.clear_session()

    mae_mean = float(np.mean([m["mae"] for m in fold_metrics]))
    print(f"\nK-Fold MAE rata-rata (skala asli): {mae_mean:.4f}")
    return fold_metrics


def train_full_export(
    pairs_df,
    output_dir: Optional[Path] = None,
    epochs: int = 25,
    batch_size: int = 16,
    validation_fraction: float = 0.15,
    freeze_epochs: int = 6,
    unfreeze_layers: int = 25,
    verbose: int = 1,
) -> Tuple[keras.Model, StandardScaler, Path, Dict[str, Any]]:
    output_dir = output_dir or (repo_root() / "models" / "receipt_total")
    output_dir.mkdir(parents=True, exist_ok=True)

    paths = pairs_df["image_path"].values
    totals = pairs_df["total"].values.astype(np.float32)
    X_all = load_images_matrix(paths)
    n = len(paths)
    rng = np.random.RandomState(42)
    idx = rng.permutation(n)
    n_val = max(1, int(n * validation_fraction))
    val_idx = idx[:n_val]
    train_idx = idx[n_val:]

    scaler = StandardScaler()
    y_tr = scaler.fit_transform(totals[train_idx].reshape(-1, 1)).ravel()
    y_va = scaler.transform(totals[val_idx].reshape(-1, 1)).ravel()

    train_idg = ImageDataGenerator(
        preprocessing_function=PREPROCESS,
        horizontal_flip=True,
        brightness_range=(0.88, 1.12),
        zoom_range=0.05,
    )
    val_idg = ImageDataGenerator(preprocessing_function=PREPROCESS)
    gen_tr = train_idg.flow(X_all[train_idx], y_tr, batch_size=batch_size, seed=42)
    gen_va = val_idg.flow(X_all[val_idx], y_va, batch_size=batch_size, shuffle=False)
    steps_tr = max(1, int(np.ceil(len(train_idx) / batch_size)))
    steps_va = max(1, int(np.ceil(len(val_idx) / batch_size)))

    model = build_model()
    model.compile(
        optimizer=keras.optimizers.Adam(1e-3),
        loss=keras.losses.Huber(),
        metrics=[keras.metrics.MeanAbsoluteError(name="mae")],
    )

    val_mae_cb = ValMAEOriginalScaleCallback(
        X_all[val_idx], totals[val_idx], scaler, evaluate_receipt_model, patience=5
    )
    checkpoint_path = output_dir / "receipt_total_best.weights.h5"

    freeze_n = min(max(1, freeze_epochs), max(1, epochs - 1))
    model.fit(
        gen_tr,
        validation_data=gen_va,
        steps_per_epoch=steps_tr,
        validation_steps=steps_va,
        epochs=freeze_n,
        verbose=verbose,
        callbacks=[val_mae_cb],
    )

    if freeze_n < epochs:
        _unfreeze_backbone_tail(model, unfreeze_layers)
        model.compile(
            optimizer=keras.optimizers.Adam(5e-5),
            loss=keras.losses.Huber(),
            metrics=[keras.metrics.MeanAbsoluteError(name="mae")],
        )
        model.fit(
            gen_tr,
            validation_data=gen_va,
            steps_per_epoch=steps_tr,
            validation_steps=steps_va,
            epochs=epochs - freeze_n,
            verbose=verbose,
            callbacks=[val_mae_cb],
        )

    if val_mae_cb.best_weights is not None:
        val_mae_cb.restore_best_weights()
        model.save_weights(str(checkpoint_path))

    val_metrics = evaluate_receipt_model(
        model, X_all[val_idx], totals[val_idx], scaler
    )
    print_regression_report("Model Struk (validasi)", val_metrics)

    weights_path = output_dir / "receipt_total_mobilenet.weights.h5"
    model.save_weights(weights_path)

    from ml.sroie_loader import merge_stats_summary

    config: Dict[str, Any] = {
        "backbone": "MobileNetV2",
        "img_height": IMG_SIZE[0],
        "img_width": IMG_SIZE[1],
        "preprocess": "mobilenet_v2",
        "target_scaler": {
            "type": "StandardScaler",
            "mean": float(scaler.mean_[0]),
            "scale": float(scaler.scale_[0]),
        },
        "n_train_samples": int(len(train_idx)),
        "n_val_samples": int(len(val_idx)),
        "n_training_pairs": int(len(pairs_df)),
        "merge_stats": merge_stats_summary(),
        "training": {
            "epochs": epochs,
            "freeze_epochs": freeze_n,
            "unfreeze_layers": unfreeze_layers,
            "early_stopping_patience": 5,
        },
        "validation_metrics": val_metrics,
        "primary_metric": "mae",
        "metric_notes": "Regresi total struk: MAE/RMSE dalam satuan nominal; hybrid entity/box lebih akurat saat inferensi.",
    }
    metrics_path = output_dir / "receipt_total_metrics.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(val_metrics, f, indent=2, ensure_ascii=False)

    config_path = output_dir / "receipt_total_config.json"
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)

    try:
        from ml.export_serving import export_receipt_keras

        export_receipt_keras(output_dir)
    except Exception as exc:
        if verbose:
            print(f"[receipt] .keras export skipped: {exc}")

    return model, scaler, weights_path, val_metrics


def predict_total(
    image_path: str,
    weights_path: Optional[Path] = None,
    config_path: Optional[Path] = None,
) -> float:
    root = repo_root()
    out_dir = root / "models" / "receipt_total"
    weights_path = weights_path or (out_dir / "receipt_total_mobilenet.weights.h5")
    config_path = config_path or (out_dir / "receipt_total_config.json")

    with open(config_path, encoding="utf-8") as f:
        cfg = json.load(f)
    scaler_mean = cfg["target_scaler"]["mean"]
    scaler_scale = cfg["target_scaler"]["scale"]

    model = build_model()
    model.load_weights(str(weights_path))

    img = keras.utils.load_img(image_path, target_size=IMG_SIZE)
    x = keras.utils.img_to_array(img)
    x = keras.applications.mobilenet_v2.preprocess_input(np.expand_dims(x, 0))
    y_s = float(model.predict(x, verbose=0)[0, 0])
    scale = max(float(scaler_scale), 1e-8)
    total_pred = y_s * scale + scaler_mean
    return max(0.0, total_pred)


def default_pairs_dataframe():
    """Training pairs from resolved SROIE root (sroie2 if present, else sroie)."""
    _, pairs, _, sroie_root = prepare_receipt_training_data()
    print(f"SROIE data root: {sroie_root} | training pairs: {len(pairs)}")
    return pairs


if __name__ == "__main__":
    import argparse

    p = argparse.ArgumentParser()
    p.add_argument("--kfold", action="store_true", help="Run K-fold CV (slower)")
    p.add_argument("--epochs", type=int, default=25)
    p.add_argument("--batch", type=int, default=16)
    args = p.parse_args()

    pairs = default_pairs_dataframe()
    print(f"Training pairs: {len(pairs)}")
    if args.kfold:
        metrics = train_kfold_cv(
            pairs,
            epochs=max(3, args.epochs // 2),
            batch_size=args.batch,
            verbose=1,
        )
        print("K-fold metrics:", metrics)
    _, _, wp, metrics = train_full_export(
        pairs, epochs=args.epochs, batch_size=args.batch, verbose=1
    )
    print("Export complete:", wp)
    print("Metrik tersimpan: models/receipt_total/receipt_total_metrics.json")
