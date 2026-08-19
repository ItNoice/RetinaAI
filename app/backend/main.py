"""RetinaAI backend API.

Serves image validation/preprocessing, and — when a trained checkpoint is
present at ml.inference.MODEL_PATH — real model inference. /api/analyze
returns prediction: null whenever no model is loaded; it never fabricates a
result.
"""

from __future__ import annotations

import base64
import sys
import time
from pathlib import Path

# Allow `import ml` (a top-level sibling package, not part of app.backend)
# regardless of how uvicorn was invoked.
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

app = FastAPI(
    title="RetinaAI API",
    description=(
        "Research-prototype API for retinal fundus image validation, "
        "preprocessing, and (once integrated) diabetic retinopathy "
        "classification. Not a medical device."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    # A fixed port list is brittle in local dev — Vite silently bumps to
    # 5174, 5175, etc. whenever 5173 is already taken (e.g. another
    # instance of this app already running), and a mismatched port here
    # makes the frontend fall back to "backend unreachable" for reasons
    # that look identical to the backend actually being down. This backend
    # has no auth and is local-only, so matching any localhost port is safe.
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
    """Drops the cached checkpoint so the next request re-reads
    models/dr_classifier.pt from disk — useful after running ml/train.py
    again without restarting this server. Returns the resulting status,
    same shape as GET /api/model/status."""
    reload_model()
    return get_model_status()


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(file: UploadFile = File(...)) -> AnalyzeResponse:
    data = await file.read()

    start = time.perf_counter()
    try:
        result = preprocess(data)
    except ImageValidationError as exc:
        # Hard failures only — undersized images are a soft flag, handled below.
        raise HTTPException(
            status_code=422, detail={"code": exc.code, "message": exc.message}
        ) from exc
    elapsed_ms = (time.perf_counter() - start) * 1000

    quality = (
        QualityCheck(
            passed=False,
            issues=["too-small"],
            message="Image quality may be insufficient for reliable model analysis.",
        )
        if result.too_small
        else QualityCheck(passed=True, issues=[], message=None)
    )

    # None whenever no checkpoint is loaded — never a fabricated result.
    raw_prediction = predict(result.normalized)
    prediction = (
        PredictionResult(
            model_version=raw_prediction.model_version,
            processing_time_ms=raw_prediction.processing_time_ms,
            predicted_class=raw_prediction.predicted_class,
            confidence=raw_prediction.confidence,
            probabilities=raw_prediction.probabilities,
        )
        if raw_prediction
        else None
    )

    cropped_preview_b64: str | None = None
    heatmap_b64: str | None = None
    if raw_prediction is not None:
        model = get_loaded_model()
        if model is not None:
            heatmap_png = generate_gradcam_png(
                model, result.normalized, raw_prediction.predicted_class_idx
            )
            heatmap_b64 = base64.b64encode(heatmap_png).decode("ascii")
            cropped_preview_b64 = base64.b64encode(result.preview_png).decode("ascii")

    return AnalyzeResponse(
        width=result.original_width,
        height=result.original_height,
        cropped_width=result.cropped_width,
        cropped_height=result.cropped_height,
        quality=quality,
        preprocessing_time_ms=round(elapsed_ms, 2),
        prediction=prediction,
        cropped_preview_png_base64=cropped_preview_b64,
        heatmap_png_base64=heatmap_b64,
    )
