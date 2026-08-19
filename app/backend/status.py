"""Live model/dataset status, backed by whatever is actually on disk.

Mirrors app/frontend/src/lib/modelStatus.ts's shape. Before a checkpoint
exists at ml.inference.MODEL_PATH, `model_status()` reports `available:
False` — never a fabricated architecture/version.
"""

import json
from pathlib import Path

from ml.inference import get_model_info

from .schemas import (
    DatasetStatusResponse,
    EpochRecord,
    MetricsResponse,
    ModelStatusResponse,
    SplitMetrics,
    TrainingLogResponse,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
METRICS_PATH = REPO_ROOT / "models" / "eval_metrics.json"
TRAIN_LOG_PATH = REPO_ROOT / "models" / "train_log.json"

TASK_DESCRIPTION = (
    "5-class DR severity grading (No DR / Mild / Moderate / Severe / Proliferative)"
)

DATASET_STATUS = DatasetStatusResponse(
    name="DDR grading subset",
    license="CC BY 4.0",
    num_images=13673,
    note=(
        "Full DDR grading-split size shown above; training itself used a "
        "smaller, compute-constrained stratified subset (CPU-only — no GPU "
        "available)."
    ),
)

_UNAVAILABLE_DATASET_STATUS = DatasetStatusResponse(
    name=None,
    license=None,
    num_images=None,
    note=(
        "No dataset has been integrated yet. See DATASET.md for candidate "
        "public datasets under consideration."
    ),
)


def model_status() -> ModelStatusResponse:
    info = get_model_info()
    if not info.available:
        return ModelStatusResponse(
            available=False,
            name="Diabetic retinopathy classifier",
            version=None,
            architecture=None,
            task=TASK_DESCRIPTION,
            trained_on=None,
            note=(
                "No trained model is connected yet. Uploaded images are "
                "validated and preprocessed, but no prediction is produced."
            ),
        )
    return ModelStatusResponse(
        available=True,
        name="Diabetic retinopathy classifier",
        version=info.version,
        architecture=info.architecture,
        task=TASK_DESCRIPTION,
        trained_on=info.trained_on,
        note=(
            "Experimental research model. Predictions are not a medical "
            "diagnosis — see the About & Safety page."
        ),
    )


def dataset_status() -> DatasetStatusResponse:
    info = get_model_info()
    return DATASET_STATUS if info.available else _UNAVAILABLE_DATASET_STATUS


def metrics_status() -> MetricsResponse:
    """Reads models/eval_metrics.json, written by ml/evaluate.py. Returns
    available=False with no split data when that file doesn't exist — a
    trained-but-unevaluated model reports no metrics rather than fabricated
    ones."""
    if not METRICS_PATH.exists():
        return MetricsResponse(
            available=False,
            note=(
                "No evaluation has been run yet. Metrics will appear here "
                "once ml/evaluate.py has been run against a real held-out "
                "split."
            ),
        )

    data = json.loads(METRICS_PATH.read_text())
    return MetricsResponse(
        available=True,
        note=(
            "Computed by ml/evaluate.py against real DDR grading-split "
            "data — see DATASET.md. Train/valid metrics use the same "
            "(capped) subset actually used for training/checkpoint "
            "selection; test metrics use the full, uncapped, held-out "
            "test split."
        ),
        train=SplitMetrics(**data["train"]) if "train" in data else None,
        valid=SplitMetrics(**data["valid"]) if "valid" in data else None,
        test=SplitMetrics(**data["test"]) if "test" in data else None,
    )


def training_log() -> TrainingLogResponse:
    """Reads models/train_log.json, written by ml/train.py — the real
    per-epoch history of the actual training run that produced
    dr_classifier.pt. Returns available=False when no run has happened."""
    if not TRAIN_LOG_PATH.exists():
        return TrainingLogResponse(
            available=False,
            note="No training run has been logged yet. Run ml/train.py to produce one.",
        )

    data = json.loads(TRAIN_LOG_PATH.read_text())
    return TrainingLogResponse(
        available=True,
        note=(
            "The actual per-epoch history of the training run that produced "
            "the currently loaded checkpoint — see ml/train.py."
        ),
        history=[EpochRecord(**epoch) for epoch in data["history"]],
        best_val_acc=data["best_val_acc"],
        total_time_s=data["total_time_s"],
        hyperparameters=data["args"],
    )
