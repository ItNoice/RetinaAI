"""RetinaAI backend API.

/api/analyze returns `prediction: null` when no model is loaded — it never
falls back or guesses. Everything downstream is built on that.
"""

from __future__ import annotations

import base64
import logging
import sys
import time
from pathlib import Path

# `ml` is a top-level sibling package — this makes `uvicorn app.backend.main:app`
# work from any directory, not just the repo root.
REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from ml.explainability import generate_gradcam_png
from ml.inference import get_loaded_model, predict, reload_model
from ml.preprocessing import ImageValidationError, preprocess

from .schemas import (
    AnalyzeResponse,
    DatasetStatusResponse,
    MetricsResponse,
    ModelStatusResponse,
    PredictionResult,
    QualityCheck,
    TrainingLogResponse,
)
from .status import dataset_status as get_dataset_status
from .status import metrics_status as get_metrics_status
from .status import model_status as get_model_status
from .status import training_log as get_training_log

logger = logging.getLogger(__name__)

app = FastAPI(
    title="RetinaAI API",
    description=(
        "Research-prototype API for retinal fundus image validation, "
        "preprocessing, and diabetic retinopathy classification. "
        "Not a medical device."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    # Any localhost port: Vite moves to 5174, 5175, ... when 5173 is taken, and
    # a hardcoded list turns that into a CORS error that looks like the backend
    # being down. Local-only and unauthed, so there's nothing to protect here.
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/model/status", response_model=ModelStatusResponse)
def model_status() -> ModelStatusResponse:
    return get_model_status()


@app.get("/api/dataset/status", response_model=DatasetStatusResponse)
def dataset_status() -> DatasetStatusResponse:
    return get_dataset_status()


@app.get("/api/metrics", response_model=MetricsResponse)
def metrics() -> MetricsResponse:
    return get_metrics_status()


@app.get("/api/training-log", response_model=TrainingLogResponse)
def training_log() -> TrainingLogResponse:
    return get_training_log()


@app.post("/api/model/reload")
def model_reload() -> ModelStatusResponse:
    """Pick up a retrained checkpoint without restarting the server."""
    # Returns the resulting status so the caller can see whether it loaded.
    reload_model()
    return get_model_status()


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(file: UploadFile = File(...)) -> AnalyzeResponse:
    data = await file.read()

    start = time.perf_counter()
    try:
        result = preprocess(data)
    except ImageValidationError as exc:
        # Hard failures only — undersized images are flagged below, not rejected.
        raise HTTPException(
            status_code=422, detail={"code": exc.code, "message": exc.message}
        ) from exc
    preprocessing_ms = (time.perf_counter() - start) * 1000

    quality = (
        QualityCheck(
            passed=False,
            issues=["too-small"],
            message="Image quality may be insufficient for reliable model analysis.",
        )
        if result.too_small
        else QualityCheck(passed=True, issues=[], message=None)
    )

    raw_prediction = predict(result.normalized)
    if raw_prediction is None:
        # No model. Preprocessing results only; the frontend shows "model unavailable".
        return AnalyzeResponse(
            width=result.original_width,
            height=result.original_height,
            cropped_width=result.cropped_width,
            cropped_height=result.cropped_height,
            quality=quality,
            preprocessing_time_ms=round(preprocessing_ms, 2),
            prediction=None,
        )

    return AnalyzeResponse(
        width=result.original_width,
        height=result.original_height,
        cropped_width=result.cropped_width,
        cropped_height=result.cropped_height,
        quality=quality,
        preprocessing_time_ms=round(preprocessing_ms, 2),
        prediction=PredictionResult(
            model_version=raw_prediction.model_version,
            processing_time_ms=raw_prediction.processing_time_ms,
            predicted_class=raw_prediction.predicted_class,
            confidence=raw_prediction.confidence,
            probabilities=raw_prediction.probabilities,
        ),
        cropped_preview_png_base64=_b64(result.preview_png),
        heatmap_png_base64=_build_heatmap(result.normalized, raw_prediction.predicted_class_idx),
    )


def _build_heatmap(normalized_image, predicted_class_idx: int) -> str | None:
    """Grad-CAM for the prediction, or None if it couldn't be produced."""
    model = get_loaded_model()
    if model is None:
        return None

    try:
        return _b64(generate_gradcam_png(model, normalized_image, predicted_class_idx))
    except Exception:
        # The heatmap is a nice-to-have; don't lose the analysis over it. Logged
        # loudly, because a silently missing heatmap is easy not to notice.
        logger.exception("Grad-CAM generation failed; returning prediction without a heatmap")
        return None


def _b64(png_bytes: bytes) -> str:
    """Base64 for JSON transport. No `data:` prefix — the frontend adds it."""
    return base64.b64encode(png_bytes).decode("ascii")
