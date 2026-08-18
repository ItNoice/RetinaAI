"""Pydantic response models for the RetinaAI API.

Field names/shapes intentionally mirror app/frontend/src/lib/types.ts so the
two stay in sync by inspection.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

QualityIssue = Literal["not-an-image", "too-small", "file-too-large", "corrupted"]


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
    # Never fabricated: null until a real model (Phase 3) is wired in.
    prediction: PredictionResult | None = None


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
