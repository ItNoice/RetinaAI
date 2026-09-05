"""Image validation and preprocessing for retinal fundus photographs.

raw bytes -> validate -> crop to the fundus circle -> resize -> normalize.

The backend and the training pipeline both go through here, which is the
whole point: if serving preprocessed differently from training, the model
would see a subtly different distribution at inference time and quietly get
worse. Keep this module the single path.

Fundus photos are a bright circle on a black surround, usually with a lot of
surround. Cropping to the circle before resizing means the retina keeps most
of the 224x224 budget instead of spending it on black borders.
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

# The backbone is ImageNet-pretrained, so inputs have to be normalized with
# ImageNet's statistics for the pretrained weights to mean anything.
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


class ImageValidationError(ValueError):
    """An upload that can't be analyzed.

    `code` is machine-readable and deliberately matches the frontend's
    QualityIssue union, so the API layer can pass it straight through
    instead of maintaining a translation table.
    """

    def __init__(self, code: str, message: str):
        super().__init__(message)
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
    """Decode upload bytes to an RGB image, plus a flag for "suspiciously small".

    Unreadable, oversized, and corrupt files raise. Small ones don't: a
    clinician uploading a low-resolution photo should get a result with a
    quality warning attached, not a rejection and certainly not a silent
    "No DR".
    """
    # Check size before decoding — no point handing a 200 MB file to Pillow.
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
        # Pillow is lazy; load() is what actually forces a decode, and where
        # truncated files blow up rather than at first pixel access.
        img.load()
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
        # Fundus photos are usually RGB already, but CMYK TIFFs and paletted
        # PNGs do turn up, and everything downstream assumes 3 channels.
        img = img.convert("RGB")
    except OSError as exc:
        raise ImageValidationError(
            "corrupted", "This file appears to be corrupted."
        ) from exc

    width, height = img.size
    too_small = width < MIN_DIMENSION_PX or height < MIN_DIMENSION_PX

    return img, too_small


def crop_to_fundus(image: np.ndarray) -> np.ndarray:
    """Crop away the black surround around the fundus circle.

    Returns the image untouched when there's no clear circle to find — some
    images are already tightly cropped, and a bad crop is worse than none.
    """
    gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

    # Threshold at 10 rather than something adaptive: the surround is
    # near-black by construction, and a fixed cut works across the whole
    # brightness range of real fundus cameras without tuning.
    _, mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return image

    # The fundus is by far the largest lit region; smaller contours are
    # burned-in timestamps, camera artifacts, and lens flare.
    largest = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest)

    # Sanity check: if the "fundus" we found is tiny, we latched onto an
    # artifact instead. Bail out rather than crop the retina away.
    min_area_fraction = 0.15
    if w * h < min_area_fraction * image.shape[0] * image.shape[1]:
        return image

    return image[y : y + h, x : x + w]


def resize_image(image: np.ndarray, size: int) -> np.ndarray:
    # INTER_AREA because we're almost always downscaling, and it avoids the
    # aliasing that INTER_LINEAR leaves on fine vessel structure.
    return cv2.resize(image, (size, size), interpolation=cv2.INTER_AREA)


def normalize_image(image: np.ndarray) -> np.ndarray:
    float_img = image.astype(np.float32) / 255.0
    normalized = (float_img - IMAGENET_MEAN) / IMAGENET_STD
    # HWC -> CHW, the layout torchvision models expect.
    return np.transpose(normalized, (2, 0, 1))


def preprocess(data: bytes, size: int = 224) -> PreprocessResult:
    pil_image, too_small = validate_image_bytes(data)
    rgb = np.array(pil_image)

    original_height, original_width = rgb.shape[:2]
    cropped = crop_to_fundus(rgb)
    cropped_height, cropped_width = cropped.shape[:2]

    resized = resize_image(cropped, size)
    normalized = normalize_image(resized)

    # Keep the resized (pre-normalization) image around: the frontend
    # composites the Grad-CAM heatmap over this exact frame, so it has to be
    # the same crop the model saw, not the original upload.
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
