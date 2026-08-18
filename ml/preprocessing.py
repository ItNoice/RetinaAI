"""Image validation and preprocessing for the retinal-image pipeline.

Pipeline stage: raw image -> validate -> crop to fundus content -> resize ->
normalize. This module is shared by the backend API (app/backend) and, later,
by ml/train.py / ml/inference.py, so preprocessing is guaranteed to be
identical between training and serving.

Crop/resize/normalize choices follow common preprocessing for transfer
learning on fundus photographs: fundus images are typically a bright circular
region on a black background, so we crop to that circle's bounding box before
resizing, and normalize with ImageNet statistics so the output is ready for
an ImageNet-pretrained backbone (EfficientNet/ResNet/DenseNet).
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

# ImageNet normalization statistics — used because Phase 3's model is a
# transfer-learning backbone pretrained on ImageNet.
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


class ImageValidationError(ValueError):
    """Raised when an uploaded file fails validation. `code` is machine-
    readable so the API layer can map it to the same QualityIssue values the
    frontend already understands."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass
class PreprocessResult:
    normalized: np.ndarray  # float32, shape (3, size, size), ImageNet-normalized
    preview_png: bytes  # cropped + resized image, for display/debugging
    original_width: int
    original_height: int
    cropped_width: int
    cropped_height: int
    too_small: bool


def validate_image_bytes(data: bytes) -> tuple[Image.Image, bool]:
    """Validates raw upload bytes and returns a decoded RGB PIL image plus
    whether it is undersized.

    Hard failures (not-an-image / file-too-large / corrupted) raise
    ImageValidationError, using the same codes as the frontend's QualityIssue
    union. Undersized images are a soft failure — the caller still gets a
    usable image, flagged as `too_small`, matching the product requirement
    that low-quality images are flagged rather than silently rejected or
    treated as healthy.
    """
    if len(data) > MAX_FILE_SIZE_BYTES:
        raise ImageValidationError("file-too-large", "File is too large.")

    try:
        img = Image.open(BytesIO(data))
        img.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ImageValidationError(
            "not-an-image", "This file could not be read as an image."
        ) from exc

    if img.format not in SUPPORTED_FORMATS:
        raise ImageValidationError(
            "not-an-image",
            f"Unsupported image format: {img.format}.",
        )

    try:
        img = img.convert("RGB")
    except OSError as exc:
        raise ImageValidationError(
            "corrupted", "This file appears to be corrupted."
        ) from exc

    width, height = img.size
    too_small = width < MIN_DIMENSION_PX or height < MIN_DIMENSION_PX

    return img, too_small


def crop_to_fundus(image: np.ndarray) -> np.ndarray:
    """Crops to the bounding box of the bright fundus circle, removing the
    black surround common in raw fundus photographs. Falls back to the
    original image if no clear foreground region is found (e.g. the photo
    already fills the frame).
    """
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    # A fixed low threshold separates the (near-black) surround from the
    # fundus circle regardless of the fundus's own brightness/color.
    _, mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return image

    largest = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest)

    min_area_fraction = 0.15
    if w * h < min_area_fraction * image.shape[0] * image.shape[1]:
        return image

    return image[y : y + h, x : x + w]


def resize_image(image: np.ndarray, size: int) -> np.ndarray:
    return cv2.resize(image, (size, size), interpolation=cv2.INTER_AREA)


def normalize_image(image: np.ndarray) -> np.ndarray:
    """Scales to [0, 1], applies ImageNet mean/std, and returns CHW float32
    — the layout torchvision models expect."""
    float_img = image.astype(np.float32) / 255.0
    normalized = (float_img - IMAGENET_MEAN) / IMAGENET_STD
    return np.transpose(normalized, (2, 0, 1))


def preprocess(data: bytes, size: int = 224) -> PreprocessResult:
    pil_image, too_small = validate_image_bytes(data)
    rgb = np.array(pil_image)

    original_height, original_width = rgb.shape[:2]
    cropped = crop_to_fundus(rgb)
    cropped_height, cropped_width = cropped.shape[:2]

    resized = resize_image(cropped, size)
    normalized = normalize_image(resized)

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
