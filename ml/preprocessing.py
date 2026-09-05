"""Validation and preprocessing for fundus photographs.

raw bytes -> validate -> crop to the fundus circle -> resize -> normalize.
Training and serving both go through here so the model sees one distribution.
"""

from __future__ import annotations

from dataclasses import dataclass
from io import BytesIO

import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError

SUPPORTED_FORMATS = {"JPEG", "PNG", "TIFF", "WEBP"}
MIN_DIMENSION_PX = 128
MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024

# ImageNet stats, because the backbone is ImageNet-pretrained.
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


class ImageValidationError(ValueError):
    """An upload that can't be analyzed."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        # Codes match the frontend's QualityIssue union, so the API can pass
        # them straight through.
        self.code = code
        self.message = message


@dataclass
class PreprocessResult:
    normalized: np.ndarray  # float32 (3, size, size), ImageNet-normalized
    preview_png: bytes  # the cropped+resized image the model actually saw
    original_width: int
    original_height: int
    cropped_width: int
    cropped_height: int
    too_small: bool


def validate_image_bytes(data: bytes) -> tuple[Image.Image, bool]:
    """Decode upload bytes to RGB, plus a flag for "suspiciously small"."""
    # Size first — no point handing a 200 MB file to Pillow.
    if len(data) > MAX_FILE_SIZE_BYTES:
        raise ImageValidationError(
            "file-too-large",
            f"File is {len(data) / 1024 / 1024:.1f} MB; the limit is "
            f"{MAX_FILE_SIZE_BYTES // 1024 // 1024} MB.",
        )

    if not data:
        raise ImageValidationError("not-an-image", "The uploaded file is empty.")

    try:
        img = Image.open(BytesIO(data))
        img.load()  # Pillow is lazy; this is what actually decodes, and where truncated files blow up
    except (UnidentifiedImageError, OSError) as exc:
        raise ImageValidationError(
            "not-an-image", "This file could not be read as an image."
        ) from exc

    if img.format not in SUPPORTED_FORMATS:
        raise ImageValidationError(
            "not-an-image",
            f"Unsupported image format: {img.format or 'unknown'}. "
            f"Supported: {', '.join(sorted(SUPPORTED_FORMATS))}.",
        )

    try:
        # CMYK TIFFs and paletted PNGs turn up; everything downstream wants 3 channels.
        img = img.convert("RGB")
    except OSError as exc:
        raise ImageValidationError(
            "corrupted", "This file appears to be corrupted."
        ) from exc

    width, height = img.size
    # Soft failure: small images get analyzed with a warning, not rejected.
    too_small = width < MIN_DIMENSION_PX or height < MIN_DIMENSION_PX

    return img, too_small


def crop_to_fundus(image: np.ndarray) -> np.ndarray:
    """Crop away the black surround around the fundus circle."""
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

    # Fixed cut at 10: the surround is near-black by construction, so this
    # works across every camera's brightness range without tuning.
    _, mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return image  # already tightly cropped; a bad crop is worse than none

    # The fundus is the largest lit region; the rest is timestamps and flare.
    largest = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest)

    # A "fundus" this small means we latched onto an artifact — don't crop the retina away.
    min_area_fraction = 0.15
    if w * h < min_area_fraction * image.shape[0] * image.shape[1]:
        return image

    return image[y : y + h, x : x + w]


def resize_image(image: np.ndarray, size: int) -> np.ndarray:
    # INTER_AREA: we're downscaling, and it doesn't alias the fine vessels.
    return cv2.resize(image, (size, size), interpolation=cv2.INTER_AREA)


def normalize_image(image: np.ndarray) -> np.ndarray:
    float_img = image.astype(np.float32) / 255.0
    normalized = (float_img - IMAGENET_MEAN) / IMAGENET_STD
    return np.transpose(normalized, (2, 0, 1))  # HWC -> CHW, what torchvision expects


def preprocess(data: bytes, size: int = 224) -> PreprocessResult:
    pil_image, too_small = validate_image_bytes(data)
    rgb = np.array(pil_image)

    original_height, original_width = rgb.shape[:2]
    cropped = crop_to_fundus(rgb)
    cropped_height, cropped_width = cropped.shape[:2]

    resized = resize_image(cropped, size)
    normalized = normalize_image(resized)

    # Keep the resized-but-not-normalized frame: the heatmap is drawn over
    # this exact crop, so it can't be the original upload.
    preview_buffer = BytesIO()
    Image.fromarray(resized).save(preview_buffer, format="PNG")

    return PreprocessResult(
        normalized=normalized,
        preview_png=preview_buffer.getvalue(),
        original_width=original_width,
        original_height=original_height,
        cropped_width=cropped_width,
        cropped_height=cropped_height,
        too_small=too_small,
    )
