"""RetinaAI backend API.

Serves image validation/preprocessing today; Phase 3 adds real model
inference to the /api/analyze endpoint (currently always returns
prediction: null — never a fabricated result).
"""

from __future__ import annotations

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

from ml.preprocessing import ImageValidationError, preprocess

from .schemas import AnalyzeResponse, DatasetStatusResponse, ModelStatusResponse, QualityCheck
from .status import DATASET_STATUS, MODEL_STATUS

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
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/model/status", response_model=ModelStatusResponse)
def model_status() -> ModelStatusResponse:
    return MODEL_STATUS


@app.get("/api/dataset/status", response_model=DatasetStatusResponse)
def dataset_status() -> DatasetStatusResponse:
    return DATASET_STATUS


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

    return AnalyzeResponse(
        width=result.original_width,
        height=result.original_height,
        cropped_width=result.cropped_width,
        cropped_height=result.cropped_height,
        quality=quality,
        preprocessing_time_ms=round(elapsed_ms, 2),
        # Phase 3 will populate this from ml/inference.py. Never fabricated.
        prediction=None,
    )
