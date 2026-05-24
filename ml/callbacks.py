"""
Custom Keras callbacks for Rekapin capstone (Main Quest: custom component).
"""

from __future__ import annotations

from typing import Any, Callable, Dict, Optional

import numpy as np
from sklearn.preprocessing import StandardScaler
from tensorflow import keras


class ValMAEOriginalScaleCallback(keras.callbacks.Callback):
    """
    Early stopping + best-weight checkpoint using validation MAE on the **original**
    target scale (e.g. currency units), not the normalized training target.

    Used by ``ml.receipt_total_model`` during MobileNet fine-tuning.
    """

    def __init__(
        self,
        X_val: np.ndarray,
        y_val_original: np.ndarray,
        scaler: StandardScaler,
        evaluate_fn: Callable[..., Dict[str, Any]],
        patience: int = 5,
    ):
        super().__init__()
        self.X_val = X_val
        self.y_val_original = y_val_original
        self.scaler = scaler
        self.evaluate_fn = evaluate_fn
        self.patience = patience
        self.best_mae = float("inf")
        self.wait = 0
        self.best_weights: Optional[list] = None

    def on_epoch_end(self, epoch: int, logs: Optional[dict] = None) -> None:
        reg = self.evaluate_fn(self.model, self.X_val, self.y_val_original, self.scaler)
        mae = float(reg["mae"])
        if logs is not None:
            logs["val_mae_original"] = mae
        if mae < self.best_mae:
            self.best_mae = mae
            self.wait = 0
            self.best_weights = self.model.get_weights()
        else:
            self.wait += 1
            if self.wait >= self.patience:
                self.model.stop_training = True

    def restore_best_weights(self) -> None:
        if self.best_weights is not None:
            self.model.set_weights(self.best_weights)
