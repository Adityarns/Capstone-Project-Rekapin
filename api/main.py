"""FastAPI REST API for Rekapin ML models (Side Quest: standalone API)."""

from __future__ import annotations

import shutil
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from ml.sroie_loader import repo_root

app = FastAPI(
    title="Rekapin ML API",
    description="Receipt, carbon, and expense forecast endpoints for Rekapin capstone.",
    version="1.0.0",
)

_MODELS: Dict[str, Any] = {}


class CarbonRequest(BaseModel):
    text: str = Field(..., examples=["pembelian pertalite 20 liter"])
    volume_liter: float = Field(..., gt=0, examples=[20.0])


class ForecastRequest(BaseModel):
    daily_totals: List[float] = Field(
        ...,
        min_length=1,
        examples=[[120.0, 0.0, 45.5, 200.0, 0.0, 90.0, 30.0, 150.0, 0.0, 60.0, 40.0, 10.0, 0.0, 85.0]],
    )


def _model_paths() -> Dict[str, Path]:
    root = repo_root()
    return {
        "receipt_keras": root / "models" / "receipt_total" / "receipt_total_serving.keras",
        "receipt_weights": root / "models" / "receipt_total" / "receipt_total_mobilenet.weights.h5",
        "carbon_keras": root / "models" / "green_carbon" / "green_eligibility_model.keras",
        "carbon_weights": root / "models" / "green_carbon" / "green_eligibility_model.weights.h5",
        "forecast_keras": root / "models" / "expense_forecast" / "expense_forecast.keras",
        "forecast_weights": root / "models" / "expense_forecast" / "expense_forecast.weights.h5",
    }


def _models_loaded_status() -> Dict[str, bool]:
    paths = _model_paths()
    return {
        "receipt": paths["receipt_keras"].is_file() or paths["receipt_weights"].is_file(),
        "carbon": paths["carbon_keras"].is_file() or paths["carbon_weights"].is_file(),
        "forecast": paths["forecast_keras"].is_file() or paths["forecast_weights"].is_file(),
    }


@app.on_event("startup")
def load_models() -> None:
    paths = _model_paths()
    if paths["carbon_weights"].is_file():
        from ml.green_carbon_model import load_model_from_h5

        _MODELS["carbon"] = load_model_from_h5(str(paths["carbon_weights"]))


@app.get("/health")
def health() -> Dict[str, Any]:
    status = _models_loaded_status()
    return {
        "status": "ok" if any(status.values()) else "degraded",
        "models_loaded": status,
    }


@app.post("/ml/receipt")
async def ml_receipt(image: UploadFile = File(...)) -> Dict[str, Any]:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload a JPEG or PNG receipt image.")

    suffix = Path(image.filename or "receipt.jpg").suffix or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(image.file, tmp)
        tmp_path = tmp.name

    try:
        from ml.receipt_pipeline import parse_receipt

        tx = parse_receipt(tmp_path)
        return {
            "predicted_total": tx.get("amount"),
            "currency_hint": "same_as_training",
            "model": "receipt_hybrid_pipeline",
            "source_total": tx.get("source_total"),
            "transaction": tx,
        }
    finally:
        Path(tmp_path).unlink(missing_ok=True)


@app.post("/ml/carbon")
def ml_carbon(body: CarbonRequest) -> Dict[str, Any]:
    model = _MODELS.get("carbon")
    if model is None:
        paths = _model_paths()
        if not paths["carbon_weights"].is_file() and not paths["carbon_keras"].is_file():
            raise HTTPException(status_code=503, detail="Carbon model not trained. Run: python -m ml.green_carbon_model")
        from ml.green_carbon_model import load_model_from_h5

        model = load_model_from_h5(str(paths["carbon_weights"]))
        _MODELS["carbon"] = model
    return model.predict_and_evaluate(body.text, body.volume_liter)


@app.post("/ml/forecast")
def ml_forecast(body: ForecastRequest) -> Dict[str, Any]:
    paths = _model_paths()
    if not paths["forecast_weights"].is_file() and not paths["forecast_keras"].is_file():
        raise HTTPException(status_code=503, detail="Forecast model not trained. Run: python -m ml.expense_forecast_model")

    from ml.expense_forecast_model import predict_horizon_total

    return predict_horizon_total(body.daily_totals)
