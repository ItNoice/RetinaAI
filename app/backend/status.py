"""Model, dataset, metrics and training-log status, read from what's on disk."""

import json
import logging
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

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[2]
METRICS_PATH = REPO_ROOT / "models" / "eval_metrics.json"
TRAIN_LOG_PATH = REPO_ROOT / "models" / "train_log.json"

MODEL_NAME = "Diabetic retinopathy classifier"
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
            name=MODEL_NAME,
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
        name=MODEL_NAME,
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
    # Keyed off the model, not the datasets/ directory: what matters is the data
    # behind the loaded checkpoint, not whatever happens to be sitting on disk.
    return DATASET_STATUS if get_model_info().available else _UNAVAILABLE_DATASET_STATUS


def metrics_status() -> MetricsResponse:
    """Evaluation metrics from models/eval_metrics.json, written by ml/evaluate.py."""
    data = _read_json(METRICS_PATH)
    if data is None:  # trained but unevaluated reports nothing, by design
        return MetricsResponse(
            available=False,
            note=(
                "No evaluation has been run yet. Metrics will appear here "
                "once ml/evaluate.py has been run against a real held-out "
                "split."
            ),
        )

    return MetricsResponse(
        available=True,
        note=(
            "Computed by ml/evaluate.py against real DDR grading-split "
            "data — see DATASET.md. Train/valid metrics use the same "
            "(capped) subset actually used for training/checkpoint "
            "selection; test metrics use the full, uncapped, held-out "
            "test split."
        ),
        # Splits are evaluated in separate runs, so any of the three may be
        # absent from the file.
        train=SplitMetrics(**data["train"]) if "train" in data else None,
        valid=SplitMetrics(**data["valid"]) if "valid" in data else None,
        test=SplitMetrics(**data["test"]) if "test" in data else None,
    )


def training_log() -> TrainingLogResponse:
    """Per-epoch history of the run that produced the current checkpoint."""
    data = _read_json(TRAIN_LOG_PATH)
    if data is None:
        return TrainingLogResponse(
            available=False,
            note="No training run has been logged yet. Run ml/train.py to produce one.",
        )

    return TrainingLogResponse(
        available=True,
        note=(
            "The actual per-epoch history of the training run that produced "
            "the currently loaded checkpoint — see ml/train.py."
        ),
        history=[EpochRecord(**epoch) for epoch in data.get("history", [])],
        best_val_acc=data.get("best_val_acc"),
        total_time_s=data.get("total_time_s"),
        hyperparameters=data.get("args", {}),
    )


def _read_json(path: Path) -> dict | None:
    """Load a JSON artifact, or None if it's missing or unreadable."""
    if not path.exists():
        return None

    try:
        return json.loads(path.read_text())
    except (json.JSONDecodeError, OSError):
        # Half-written file: ml/train.py rewrites train_log.json at the end of a
        # run and someone will hit the Research page mid-write. Better than a 500.
        logger.exception("Could not read %s; reporting it as unavailable", path)
        return None
