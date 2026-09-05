"""Load the trained classifier and run single-image inference.

Everything here is built around one rule: when there is no checkpoint, or the
one on disk won't load, this module returns None. It never falls back to an
untrained model, and it never returns a default class — "No DR" from a model
that doesn't exist is the single most dangerous thing this app could say.
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
    """Loads the checkpoint once and keeps it resident.

    Reloading ~45 MB of weights per request would dominate the latency of a
    CPU inference that itself takes a few hundred milliseconds. The lock is
    for uvicorn's threadpool: without it, two concurrent first requests both
    load the model.
    """

    def __init__(self):
        self._lock = Lock()
        self._model: torch.nn.Module | None = None
        self._checkpoint: dict | None = None
        self._loaded = False

    def _load(self) -> None:
        # Fast path, unlocked: after the first load this is every request.
        if self._loaded:
            return

        with self._lock:
            # Re-check under the lock — another thread may have loaded it
            # while we were waiting.
            if self._loaded:
                return

            # Marked loaded either way. A missing or broken checkpoint is a
            # steady state, not something to retry on every request.
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
                # Truncated file from an interrupted train run, or a
                # checkpoint from an incompatible architecture. Degrade to
                # "no model" instead of 500-ing every analyze request.
                logger.exception("Checkpoint at %s could not be loaded", MODEL_PATH)
                return

            self._model = model
            self._checkpoint = checkpoint
            logger.info("Loaded checkpoint %s (epoch %s)", MODEL_PATH, checkpoint.get("epoch"))

    def get(self) -> tuple[torch.nn.Module | None, dict | None]:
        self._load()
        return self._model, self._checkpoint

    def reload(self) -> None:
        """Drop the cached model so the next get() re-reads from disk.

        Lets a freshly trained checkpoint go live without restarting the
        server. Exposed as POST /api/model/reload.
        """
        with self._lock:
            self._model = None
            self._checkpoint = None
            self._loaded = False


_holder = _ModelHolder()


def get_model_info() -> ModelInfo:
    model, checkpoint = _holder.get()
    if model is None or checkpoint is None:
        return ModelInfo(available=False, architecture=None, version=None, trained_on=None)

    # Version string doubles as provenance in the UI, so it carries the
    # epoch and val accuracy rather than an opaque number.
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
    """Score one preprocessed image, or return None if no model is loaded.

    `normalized_image` is ml.preprocessing.preprocess's `.normalized` —
    (3, H, W) and ImageNet-normalized.
    """
    model, checkpoint = _holder.get()
    if model is None or checkpoint is None:
        return None

    start = time.perf_counter()
    with torch.no_grad():
        # unsqueeze to a batch of one; the model has no single-image path.
        tensor = torch.from_numpy(normalized_image).unsqueeze(0)
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
    """The cached nn.Module itself, for Grad-CAM.

    ml.explainability hooks layer4's activations and gradients, so unlike
    predict() it needs the module rather than its output.
    """
    model, _ = _holder.get()
    return model


def reload_model() -> None:
    _holder.reload()
