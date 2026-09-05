"""Pydantic response models for the RetinaAI API.

Field names and shapes deliberately match app/frontend/src/lib/types.ts, so
the two can be diffed by eye. There's no codegen step here; keeping them
boringly identical is what stands in for one.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

QualityIssue = Literal["not-an-image", "too-small", "file-too-large", "corrupted"]


# Kept in lockstep with the QualityIssue union in the frontend's types.ts —
# the backend passes these codes straight through to it.
class QualityCheck(BaseModel):
    passed: bool
    issues: list[QualityIssue]
    message: str | None = None


class PredictionResult(BaseModel):
    model_version: str
    processing_time_ms: float
    predicted_class: str
    confidence: float
    probabilities: dict[str, float]


class AnalyzeResponse(BaseModel):
    width: int
    height: int
    cropped_width: int
    cropped_height: int
    quality: QualityCheck
    preprocessing_time_ms: float
    # Null means "no model loaded", never "nothing wrong with this eye".
    prediction: PredictionResult | None = None
    # The exact cropped+resized frame the model scored, as base64 PNG (no
    # data: prefix). The overlay views composite the heatmap onto this rather
    # than the raw upload — heatmap coordinates only make sense in this frame.
    cropped_preview_png_base64: str | None = None
    # Grad-CAM heatmap, same dimensions as the preview above. Also null when
    # the heatmap couldn't be generated, even if the prediction succeeded.
    heatmap_png_base64: str | None = None


class ModelStatusResponse(BaseModel):
    available: bool
    name: str
    version: str | None
    architecture: str | None
    task: str
    trained_on: str | None
    note: str


class DatasetStatusResponse(BaseModel):
    name: str | None
    license: str | None
    num_images: int | None
    note: str


class ErrorResponse(BaseModel):
    code: str
    message: str


class SplitMetrics(BaseModel):
    split: Literal["train", "valid", "test"]
    dataset: str
    model_version: str
    num_images_evaluated: int
    class_distribution: dict[str, int]
    accuracy: float
    precision_macro: float
    recall_macro: float
    f1_macro: float
    roc_auc_macro: float | None
    confusion_matrix: list[list[int]]
    class_names: list[str]


class MetricsResponse(BaseModel):
    available: bool
    note: str
    train: SplitMetrics | None = None
    valid: SplitMetrics | None = None
    test: SplitMetrics | None = None


class EpochRecord(BaseModel):
    epoch: int
    train_loss: float
    train_acc: float
    val_loss: float
    val_acc: float
    epoch_time_s: float


class TrainingLogResponse(BaseModel):
    available: bool
    note: str
    history: list[EpochRecord] = []
    best_val_acc: float | None = None
    total_time_s: float | None = None
    hyperparameters: dict[str, str] = {}
