from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app.backend.main import app

client = TestClient(app)


def make_jpeg_bytes(size=(300, 200)) -> bytes:
    img = Image.new("RGB", size, (120, 60, 30))
    buf = BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_model_status_is_honest_about_no_model():
    res = client.get("/api/model/status")
    assert res.status_code == 200
    body = res.json()
    assert body["available"] is False
    assert body["version"] is None


def test_dataset_status_is_honest_about_no_dataset():
    res = client.get("/api/dataset/status")
    assert res.status_code == 200
    body = res.json()
    assert body["name"] is None


def test_analyze_never_fabricates_a_prediction():
    files = {"file": ("test.jpg", make_jpeg_bytes(), "image/jpeg")}
    res = client.post("/api/analyze", files=files)
    assert res.status_code == 200
    body = res.json()
    assert body["prediction"] is None
    assert body["quality"]["passed"] is True


def test_analyze_flags_undersized_image_without_rejecting():
    files = {"file": ("tiny.jpg", make_jpeg_bytes(size=(50, 50)), "image/jpeg")}
    res = client.post("/api/analyze", files=files)
    assert res.status_code == 200
    body = res.json()
    assert body["quality"]["passed"] is False
    assert "too-small" in body["quality"]["issues"]


def test_analyze_rejects_non_image_upload():
    files = {"file": ("notes.txt", b"not an image", "text/plain")}
    res = client.post("/api/analyze", files=files)
    assert res.status_code == 422
    assert res.json()["detail"]["code"] == "not-an-image"
