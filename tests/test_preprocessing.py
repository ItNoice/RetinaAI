from io import BytesIO

import numpy as np
import pytest
from PIL import Image

from ml.preprocessing import ImageValidationError, preprocess, validate_image_bytes


def make_jpeg_bytes(size=(300, 200), color=(120, 60, 30)) -> bytes:
    img = Image.new("RGB", size, color)
    buf = BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def make_fundus_like_bytes(width=400, height=300) -> bytes:
    """A bright ellipse on a black background, like a real fundus photo's
    circular field of view surrounded by black."""
    arr = np.zeros((height, width, 3), dtype=np.uint8)
    yy, xx = np.mgrid[0:height, 0:width]
    cx, cy = width / 2, height / 2
    mask = ((xx - cx) / (width * 0.32)) ** 2 + ((yy - cy) / (height * 0.42)) ** 2 <= 1
    arr[mask] = (140, 60, 30)
    buf = BytesIO()
    Image.fromarray(arr).save(buf, format="JPEG")
    return buf.getvalue()


def test_validate_accepts_normal_image():
    data = make_jpeg_bytes()
    img, too_small = validate_image_bytes(data)
    assert img.size == (300, 200)
    assert too_small is False


def test_validate_flags_undersized_image_without_raising():
    data = make_jpeg_bytes(size=(50, 50))
    img, too_small = validate_image_bytes(data)
    assert img is not None
    assert too_small is True


def test_validate_rejects_non_image_bytes():
    with pytest.raises(ImageValidationError) as exc_info:
        validate_image_bytes(b"this is not an image")
    assert exc_info.value.code == "not-an-image"


def test_validate_rejects_oversized_file():
    oversized = b"\x00" * (26 * 1024 * 1024)
    with pytest.raises(ImageValidationError) as exc_info:
        validate_image_bytes(oversized)
    assert exc_info.value.code == "file-too-large"


def test_preprocess_crops_to_fundus_bounding_box():
    data = make_fundus_like_bytes(400, 300)
    result = preprocess(data, size=224)
    assert result.original_width == 400
    assert result.original_height == 300
    assert result.cropped_width < 400
    assert result.cropped_height < 300
    assert result.too_small is False


def test_preprocess_output_is_normalized_and_correctly_shaped():
    data = make_jpeg_bytes(size=(300, 200))
    result = preprocess(data, size=224)
    assert result.normalized.shape == (3, 224, 224)
    assert result.normalized.dtype == np.float32
    # ImageNet-normalized values are centered near zero, not raw [0, 255].
    assert -3.0 < float(result.normalized.mean()) < 3.0


def test_preprocess_flags_too_small_instead_of_raising():
    data = make_jpeg_bytes(size=(50, 50))
    result = preprocess(data, size=224)
    assert result.too_small is True
    assert result.normalized.shape == (3, 224, 224)
