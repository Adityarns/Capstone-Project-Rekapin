"""
GreenEligibilityModel: fuel-type text classification + national FE-based CO2 estimate.
TensorFlow subclassing Model; extended dummy data + sklearn classification metrics.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report

from ml.metrics import (
    classification_metrics,
    print_classification_report_block,
    strip_for_json,
)
from sklearn.model_selection import train_test_split
from tensorflow.keras import Model, layers

# --- Emission factors (national BBM reference) ---
EMISSION_FACTORS: Dict[str, Dict] = {
    "bensin_ron90": {
        "label": "Bensin RON 90 (Pertalite)",
        "fe": 69.29,
        "ncv": 44.61,
        "density_kg_per_liter": 0.740,
    },
    "bensin_ron92": {
        "label": "Bensin RON 92 (Pertamax)",
        "fe": 69.04,
        "ncv": 44.61,
        "density_kg_per_liter": 0.745,
    },
    "bensin_ron95": {
        "label": "Bensin RON 95 (Pertamax Turbo)",
        "fe": 68.91,
        "ncv": 44.62,
        "density_kg_per_liter": 0.748,
        "note": "FE/NCV interpolated from RON 98 reference for capstone reporting",
    },
    "bensin_ron98": {
        "label": "Bensin RON 98 (legacy alias → use bensin_ron95)",
        "fe": 68.91,
        "ncv": 44.62,
        "density_kg_per_liter": 0.750,
    },
    "solar_cn48": {
        "label": "Minyak Solar CN 48",
        "fe": 73.28,
        "ncv": 43.27,
        "density_kg_per_liter": 0.832,
    },
    "solar_cn51": {
        "label": "Minyak Solar CN 51 (Dexlite)",
        "fe": 72.93,
        "ncv": 43.43,
        "density_kg_per_liter": 0.840,
    },
    "solar_cn53": {
        "label": "Minyak Solar CN 53 (Pertamina Dex)",
        "fe": 72.85,
        "ncv": 43.55,
        "density_kg_per_liter": 0.845,
    },
    "lpg": {
        "label": "LPG (Liquefied Petroleum Gas)",
        "fe": 65.41,
        "ncv": 46.12,
        "density_kg_per_liter": 0.540,
    },
    "avtur": {
        "label": "Avtur (Jet Fuel)",
        "fe": 72.36,
        "ncv": 43.81,
        "density_kg_per_liter": 0.800,
    },
    "minyak_tanah": {
        "label": "Minyak Tanah (Kerosene)",
        "fe": 72.43,
        "ncv": 43.75,
        "density_kg_per_liter": 0.790,
    },
}

FUEL_KEYWORDS: Dict[str, str] = {
    "ron 90": "bensin_ron90",
    "pertalite": "bensin_ron90",
    "prtalite": "bensin_ron90",
    "ron90": "bensin_ron90",
    "ron 92": "bensin_ron92",
    "pertamax": "bensin_ron92",
    "prtamax": "bensin_ron92",
    "ron92": "bensin_ron92",
    "ron 95": "bensin_ron95",
    "ron95": "bensin_ron95",
    "turbo": "bensin_ron95",
    "pertamax turbo": "bensin_ron95",
    "inf ron95": "bensin_ron95",
    "petrol ron 95": "bensin_ron95",
    # manual-only (not in 3-class training)
    "solar": "solar_cn48",
    "lpg": "lpg",
    "avtur": "avtur",
    "minyak tanah": "minyak_tanah",
}

# Active training classes: 3 Pertamina gasoline grades
CLASS_LABELS = ["bensin_ron90", "bensin_ron92", "bensin_ron95"]
GREEN_THRESHOLD_TON_CO2 = 0.5
VOCAB_SIZE = 500
SEQUENCE_LENGTH = 20
EMBEDDING_DIM = 32

# Legacy inline dummy — training uses ``ml.carbon_data.build_carbon_text_dataset``
DUMMY_DATASET: List[Tuple[str, float, str]] = [
    ("pembelian bensin ron 90 pertalite", 20.0, "bensin_ron90"),
    ("isi ulang pertamax ron 92", 30.0, "bensin_ron92"),
    ("pembelian pertamax turbo ron 95", 35.0, "bensin_ron95"),
]


@tf.keras.utils.register_keras_serializable(package="rekapin")
class GreenEligibilityModel(Model):
    """Text -> fuel softmax; use ``calculate_emission`` for CO2 tonnage."""

    def __init__(
        self,
        vocab_size: int = VOCAB_SIZE,
        sequence_length: int = SEQUENCE_LENGTH,
        embedding_dim: int = EMBEDDING_DIM,
        num_classes: int = len(CLASS_LABELS),
        **kwargs,
    ):
        super().__init__(**kwargs)
        self.vocab_size = int(vocab_size)
        self.sequence_length = int(sequence_length)
        self.embedding_dim = int(embedding_dim)
        self.num_classes = int(num_classes)
        self.vectorize_layer = layers.TextVectorization(
            max_tokens=self.vocab_size,
            output_mode="int",
            output_sequence_length=self.sequence_length,
            name="text_vectorization",
        )
        self.embedding = layers.Embedding(
            input_dim=self.vocab_size,
            output_dim=self.embedding_dim,
            name="embedding",
        )
        self.pooling = layers.GlobalAveragePooling1D(name="global_avg_pool")
        self.dense1 = layers.Dense(64, activation="relu", name="dense_1")
        self.dropout = layers.Dropout(0.3, name="dropout")
        self.dense2 = layers.Dense(32, activation="relu", name="dense_2")
        self.output_layer = layers.Dense(
            self.num_classes, activation="softmax", name="output_softmax"
        )
        self.class_labels = CLASS_LABELS

    def get_config(self):
        config = super().get_config()
        config.update(
            {
                "vocab_size": self.vocab_size,
                "sequence_length": self.sequence_length,
                "embedding_dim": self.embedding_dim,
                "num_classes": self.num_classes,
            }
        )
        return config

    def adapt(self, texts):
        self.vectorize_layer.adapt(texts)

    def call(self, inputs, training=False):
        x = self.vectorize_layer(inputs)
        x = self.embedding(x)
        x = self.pooling(x)
        x = self.dense1(x)
        x = self.dropout(x, training=training)
        x = self.dense2(x)
        return self.output_layer(x)

    def calculate_emission(self, fuel_type: str, volume_liter: float) -> Dict:
        if fuel_type not in EMISSION_FACTORS:
            raise ValueError(f"Jenis bahan bakar tidak dikenal: {fuel_type}")
        fuel_data = EMISSION_FACTORS[fuel_type]
        density = fuel_data["density_kg_per_liter"]
        mass_kg = volume_liter * density
        mass_gg = mass_kg * 1e-6
        ncv = fuel_data["ncv"]
        energy_tj = mass_gg * ncv
        fe = fuel_data["fe"]
        emission_ton = energy_tj * fe
        status = (
            "Review Required"
            if emission_ton > GREEN_THRESHOLD_TON_CO2
            else "Green Eligible"
        )
        return {
            "fuel_type": fuel_type,
            "fuel_label": fuel_data["label"],
            "volume_liter": round(volume_liter, 2),
            "mass_kg": round(mass_kg, 4),
            "energy_tj": round(energy_tj, 8),
            "emission_factor_ton_per_tj": fe,
            "ncv_tj_per_gg": ncv,
            "estimated_emission_ton_co2": round(emission_ton, 6),
            "green_threshold_ton_co2": GREEN_THRESHOLD_TON_CO2,
            "green_status": status,
        }

    def predict_and_evaluate(self, text: str, volume_liter: float) -> Dict:
        input_tensor = tf.constant([text])
        proba = self(input_tensor, training=False).numpy()[0]
        predicted_idx = int(np.argmax(proba))
        predicted_fuel = self.class_labels[predicted_idx]
        confidence = float(proba[predicted_idx])
        emission_data = self.calculate_emission(predicted_fuel, volume_liter)
        return {
            "input_text": text,
            "predicted_fuel_type": predicted_fuel,
            "confidence_score": round(confidence, 4),
            "all_probabilities": {
                self.class_labels[i]: round(float(p), 4) for i, p in enumerate(proba)
            },
            **emission_data,
        }


def prepare_dataset(dummy_data=None):
    if dummy_data is None:
        from ml.carbon_data import build_carbon_text_dataset

        dummy_data = build_carbon_text_dataset()
    dummy_data = [
        (t, v, c) for t, v, c in dummy_data if c in CLASS_LABELS
    ]
    texts = np.array([item[0] for item in dummy_data])
    volumes = np.array([item[1] for item in dummy_data], dtype=np.float32)
    label_indices = [CLASS_LABELS.index(item[2]) for item in dummy_data]
    labels_onehot = tf.keras.utils.to_categorical(
        label_indices, num_classes=len(CLASS_LABELS)
    )
    return texts, labels_onehot, volumes, np.array(label_indices)


def evaluate_green_model(
    model: GreenEligibilityModel,
    texts: np.ndarray,
    y_true_idx: np.ndarray,
) -> Dict:
    probs = model(tf.constant(texts), training=False).numpy()
    y_pred_idx = np.argmax(probs, axis=1)
    return classification_metrics(y_true_idx, y_pred_idx, CLASS_LABELS)


def print_classification_metrics(model: GreenEligibilityModel, texts, y_true_idx):
    metrics = evaluate_green_model(model, texts, y_true_idx)
    print_classification_report_block("validasi", metrics)
    print("\n--- classification_report (per kelas) ---")
    print(
        classification_report(
            y_true_idx,
            np.argmax(model(tf.constant(texts), training=False).numpy(), axis=1),
            labels=list(range(len(CLASS_LABELS))),
            target_names=CLASS_LABELS,
            zero_division=0,
        )
    )


def build_and_train_model(
    epochs: int = 40, verbose: int = 1
) -> Tuple[GreenEligibilityModel, Dict]:
    texts, labels, _, y_idx = prepare_dataset()

    try:
        idx_train, idx_val = train_test_split(
            np.arange(len(texts)),
            test_size=0.2,
            random_state=42,
            stratify=y_idx,
        )
    except ValueError:
        idx_train, idx_val = train_test_split(
            np.arange(len(texts)),
            test_size=0.2,
            random_state=42,
        )
    texts_tr, texts_va = texts[idx_train], texts[idx_val]
    labels_tr, labels_va = labels[idx_train], labels[idx_val]
    y_va = y_idx[idx_val]

    model = GreenEligibilityModel(
        vocab_size=VOCAB_SIZE,
        sequence_length=SEQUENCE_LENGTH,
        embedding_dim=EMBEDDING_DIM,
        num_classes=len(CLASS_LABELS),
        name="green_eligibility_model",
    )
    model.adapt(texts)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    model(tf.constant(["dummy text"]))
    if verbose:
        model.summary()

    model.fit(
        x=tf.constant(texts_tr),
        y=labels_tr,
        validation_data=(tf.constant(texts_va), labels_va),
        epochs=epochs,
        batch_size=8,
        verbose=verbose,
    )
    train_metrics = evaluate_green_model(model, texts_tr, y_idx[idx_train])
    val_metrics = evaluate_green_model(model, texts_va, y_va)
    print_classification_report_block("train", train_metrics)
    print_classification_metrics(model, texts_va, y_va)

    history = {
        "train": train_metrics,
        "validation": val_metrics,
        "primary_metric": "f1_macro",
        "metric_notes": "Klasifikasi 3 BBM Pertamina (RON90/92/95): accuracy + F1 macro.",
    }
    from ml.carbon_data import carbon_dataset_stats

    history["carbon_dataset_stats"] = carbon_dataset_stats()
    return model, history


def export_model_h5(
    model: GreenEligibilityModel,
    filepath: str = "green_eligibility_model.h5",
    evaluation: Optional[Dict] = None,
) -> str:
    weights_path = (
        filepath
        if filepath.endswith(".weights.h5")
        else filepath.replace(".h5", ".weights.h5")
    )
    model.save_weights(weights_path)
    config_path = weights_path.replace(".weights.h5", "_config.json")
    vocab = model.vectorize_layer.get_vocabulary()
    config = {
        "vocab_size": VOCAB_SIZE,
        "sequence_length": SEQUENCE_LENGTH,
        "embedding_dim": EMBEDDING_DIM,
        "num_classes": len(CLASS_LABELS),
        "class_labels": CLASS_LABELS,
        "vocabulary": vocab,
        "green_threshold": GREEN_THRESHOLD_TON_CO2,
    }
    if evaluation:
        config["evaluation_metrics"] = evaluation
        metrics_path = weights_path.replace(".weights.h5", "_metrics.json")
        with open(metrics_path, "w", encoding="utf-8") as f:
            json.dump(strip_for_json(evaluation), f, ensure_ascii=False, indent=2)

    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)
    print(f"Model weights: {weights_path}\nConfig: {config_path}")
    if evaluation:
        print(f"Metrik: {weights_path.replace('.weights.h5', '_metrics.json')}")
    try:
        from ml.export_serving import export_carbon_keras

        export_carbon_keras(Path(weights_path).parent)
    except Exception as exc:
        print(f"[carbon] .keras export skipped: {exc}")
    return weights_path


def load_model_from_h5(weights_path: str, config_path: str = None) -> GreenEligibilityModel:
    if config_path is None:
        if ".weights.h5" in weights_path:
            config_path = weights_path.replace(".weights.h5", "_config.json")
        else:
            config_path = weights_path.replace(".h5", "_config.json")
    with open(config_path, "r", encoding="utf-8") as f:
        config = json.load(f)
    model = GreenEligibilityModel(
        vocab_size=config["vocab_size"],
        sequence_length=config["sequence_length"],
        embedding_dim=config["embedding_dim"],
        num_classes=config["num_classes"],
    )
    model.vectorize_layer.set_vocabulary(config["vocabulary"])
    model(tf.constant(["init"]))
    model.load_weights(weights_path)
    return model


def run_demo(model: GreenEligibilityModel):
    test_cases = [
        ("pembelian bensin ron 90 untuk motor", 10.0),
        ("pengisian pertamax ron 92 mobil operasional", 50.0),
        ("beli pertalite 20 liter kendaraan dinas", 20.0),
        ("refueling pertamax turbo ron 95", 40.0),
        ("inf ron95 petrol spbu", 15.0),
    ]
    for text, volume in test_cases:
        result = model.predict_and_evaluate(text, volume)
        print(
            f"\nInput: {result['input_text']!r} | vol L: {result['volume_liter']} | "
            f"{result['fuel_label']} | CO2 t: {result['estimated_emission_ton_co2']} | {result['green_status']}"
        )


if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, "models", "green_carbon")
    os.makedirs(out_dir, exist_ok=True)
    m, eval_metrics = build_and_train_model(epochs=45, verbose=1)
    try:
        run_demo(m)
    except UnicodeEncodeError:
        print("[demo skipped: console encoding]")
    export_model_h5(
        m,
        os.path.join(out_dir, "green_eligibility_model.h5"),
        evaluation=eval_metrics,
    )
