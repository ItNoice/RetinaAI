"""Loads the trained diabetic retinopathy classifier and runs inference.

Returns None (not a fabricated result) whenever no checkpoint is present at
MODEL_PATH — the backend and frontend both treat that as "model
unavailable," never as "No DR."
"""

from __future__ import annotations

import time
from dataclasses import dataclass
from pathlib import Path
from threading import Lock

import numpy as np
import torch
import torch.nn.functional as F

from ml.model import create_model

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
    """Loads the checkpoint once and caches it. A module-level singleton
    keeps the (CPU) model resident across requests instead of reloading
    weights from disk on every /api/analyze call."""

    def __init__(self):
        self._lock = Lock()
        self._model: torch.nn.Module | None = None
        self._checkpoint: dict | None = None
        self._loaded = False

    def _load(self):
        if self._loaded:
            return
        with self._lock:
            if self._loaded:
                return
            if MODEL_PATH.exists():
                checkpoint = torch.load(MODEL_PATH, map_location="cpu", weights_only=False)
                model = create_model(num_classes=checkpoint["num_classes"], freeze_backbone=False)
                model.load_state_dict(checkpoint["model_state_dict"])
                model.eval()
                self._model = model
                self._checkpoint = checkpoint
            self._loaded = True

    def get(self) -> tuple[torch.nn.Module | None, dict | None]:
        self._load()
        return self._model, self._checkpoint


_holder = _ModelHolder()


def get_model_info() -> ModelInfo:
    model, checkpoint = _holder.get()
    if model is None or checkpoint is None:
        return ModelInfo(available=False, architecture=None, version=None, trained_on=None)
    version = f"{checkpoint['architecture']}-epoch{checkpoint['epoch']}-valacc{checkpoint['best_val_acc']:.3f}"
    return ModelInfo(
        available=True,
        architecture=checkpoint["architecture"],
        version=version,
        trained_on=checkpoint["trained_on"],
    )


def predict(normalized_image: np.ndarray) -> Prediction | None:
    """Runs inference on a single preprocessed image (output of
    ml.preprocessing.preprocess — shape (3, H, W), ImageNet-normalized).
    Returns None if no trained model is available; never fabricates a
    result."""
    model, checkpoint = _holder.get()
    if model is None or checkpoint is None:
        return None

    start = time.perf_counter()
    with torch.no_grad():
        tensor = torch.from_numpy(normalized_image).unsqueeze(0)
        logits = model(tensor)
        probs = F.softmax(logits, dim=1).squeeze(0).numpy()
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
    """Exposes the cached model for ml.explainability's Grad-CAM, which
    needs the actual nn.Module (not just its predictions) to hook into
    layer4's activations/gradients."""
    model, _ = _holder.get()
    return model
