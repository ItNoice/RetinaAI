from io import BytesIO

from fastapi.testclient import TestClient
from PIL import Image

from app.backend.main import app
from ml.types import DR_CLASSES

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


def test_model_status_is_internally_consistent():
    """Whether or not a checkpoint happens to be present in this
    environment (it's gitignored, so CI won't have one), the response must
    never claim availability without version info, or vice versa."""
    res = client.get("/api/model/status")
    assert res.status_code == 200
    body = res.json()
    if body["available"]:
        assert body["version"] is not None
        assert body["architecture"] is not None
    else:
        assert body["version"] is None
        assert body["architecture"] is None


def test_dataset_status_is_internally_consistent():
    res = client.get("/api/dataset/status")
    assert res.status_code == 200
    body = res.json()
    if body["name"] is None:
        assert body["license"] is None


def test_metrics_is_internally_consistent():
    res = client.get("/api/metrics")
    assert res.status_code == 200
    body = res.json()
    if not body["available"]:
        assert body["train"] is None
        assert body["valid"] is None
        assert body["test"] is None
    else:
        for split in ("train", "valid", "test"):
            split_data = body[split]
            assert split_data is not None
            assert 0.0 <= split_data["accuracy"] <= 1.0
            assert split_data["num_images_evaluated"] > 0
            assert set(split_data["class_names"]) == set(DR_CLASSES)


def test_analyze_never_fabricates_a_prediction():
    """Regardless of whether a model is loaded in this environment, the
    prediction (when present) must be a real, well-formed model output —
    never a hard-coded placeholder."""
    files = {"file": ("test.jpg", make_jpeg_bytes(), "image/jpeg")}
    res = client.post("/api/analyze", files=files)
    assert res.status_code == 200
    body = res.json()
    assert body["quality"]["passed"] is True

    model_available = client.get("/api/model/status").json()["available"]
    if not model_available:
        assert body["prediction"] is None
    else:
        prediction = body["prediction"]
        assert prediction is not None
        assert prediction["predicted_class"] in DR_CLASSES
        assert 0.0 <= prediction["confidence"] <= 1.0
        probs = prediction["probabilities"]
        assert set(probs.keys()) == set(DR_CLASSES)
        assert abs(sum(probs.values()) - 1.0) < 1e-3


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


def test_training_log_is_internally_consistent():
    res = client.get("/api/training-log")
    assert res.status_code == 200
    body = res.json()
    if not body["available"]:
        assert body["history"] == []
        assert body["best_val_acc"] is None
    else:
        assert len(body["history"]) > 0
        for epoch in body["history"]:
            assert epoch["epoch"] >= 1
            assert 0.0 <= epoch["train_acc"] <= 1.0
            assert 0.0 <= epoch["val_acc"] <= 1.0
        assert body["best_val_acc"] in {e["val_acc"] for e in body["history"]}
