"""Load the trained classifier and run single-image inference.

Returns None when no checkpoint is loaded — never a default class. "No DR"
from a model that doesn't exist is the worst thing this app could say.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from pathlib import Path
from threading import Lock

import numpy as np
import torch
import torch.nn.functional as F

from ml.model import create_model

logger = logging.getLogger(__name__)

REPO_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = REPO_ROOT / "models" / "dr_classifier.pt"


@dataclass
class ModelInfo:
    available: bool
    architecture: str | None
    version: str | None
    trained_on: str | None


@dataclass
class Prediction:
    model_version: str
    processing_time_ms: float
    predicted_class: str
    predicted_class_idx: int
    confidence: float
    probabilities: dict[str, float]


class _ModelHolder:
    """Loads the checkpoint once and keeps it resident."""

    def __init__(self):
        # Guards against two concurrent first requests both loading the model.
        self._lock = Lock()
        self._model: torch.nn.Module | None = None
        self._checkpoint: dict | None = None
        self._loaded = False

    def _load(self) -> None:
        if self._loaded:  # fast path, unlocked — this is every request after the first
            return

        with self._lock:
            if self._loaded:  # another thread got here while we waited
                return

            # Set even on failure: a missing checkpoint is a steady state, not
            # something to retry on every request.
            self._loaded = True

            if not MODEL_PATH.exists():
                logger.info("No checkpoint at %s; running without a model.", MODEL_PATH)
                return

            try:
                checkpoint = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)
                model = create_model(
                    num_classes=checkpoint["num_classes"], freeze_backbone=False
                )
                model.load_state_dict(checkpoint["model_state_dict"])
                model.eval()
            except (OSError, RuntimeError, KeyError):
                # Truncated file from an interrupted run, or a checkpoint from
                # another architecture. Degrade instead of 500-ing every request.
                logger.exception("Checkpoint at %s could not be loaded", MODEL_PATH)
                return

            self._model = model
            self._checkpoint = checkpoint
            logger.info("Loaded checkpoint %s (epoch %s)", MODEL_PATH, checkpoint.get("epoch"))

    def get(self) -> tuple[torch.nn.Module | None, dict | None]:
        self._load()
        return self._model, self._checkpoint

    def reload(self) -> None:
        """Drop the cached model so a retrained checkpoint goes live without a restart."""
        with self._lock:
            self._model = None
            self._checkpoint = None
            self._loaded = False


_holder = _ModelHolder()


def get_model_info() -> ModelInfo:
    model, checkpoint = _holder.get()
    if model is None or checkpoint is None:
        return ModelInfo(available=False, architecture=None, version=None, trained_on=None)

    # Doubles as provenance in the UI, hence the epoch and accuracy.
    version = (
        f"{checkpoint['architecture']}-epoch{checkpoint['epoch']}"
        f"-valacc{checkpoint['best_val_acc']:.3f}"
    )
    return ModelInfo(
        available=True,
        architecture=checkpoint["architecture"],
        version=version,
        trained_on=checkpoint["trained_on"],
    )


def predict(normalized_image: np.ndarray) -> Prediction | None:
    """Score one preprocessed image (preprocess's `.normalized`), or None if no model."""
    model, checkpoint = _holder.get()
    if model is None or checkpoint is None:
        return None

    start = time.perf_counter()
    with torch.no_grad():
        tensor = torch.from_numpy(normalized_image).unsqueeze(0)  # batch of one
        probs = F.softmax(model(tensor), dim=1).squeeze(0).numpy()
    elapsed_ms = (time.perf_counter() - start) * 1000

    class_names: list[str] = checkpoint["class_names"]
    predicted_idx = int(np.argmax(probs))

    return Prediction(
        model_version=get_model_info().version or "unknown",
        processing_time_ms=round(elapsed_ms, 2),
        predicted_class=class_names[predicted_idx],
        predicted_class_idx=predicted_idx,
        confidence=float(probs[predicted_idx]),
        probabilities={name: float(p) for name, p in zip(class_names, probs)},
    )


def get_loaded_model() -> torch.nn.Module | None:
    """The nn.Module itself — Grad-CAM hooks layer4, so it needs more than predictions."""
    model, _ = _holder.get()
    return model


def reload_model() -> None:
    _holder.reload()
