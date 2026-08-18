"""Single source of truth for whether a real model/dataset is wired up.

Mirrors app/frontend/src/lib/modelStatus.ts. Phase 3 replaces `available`
with True and fills in the real architecture/version once ml/inference.py
loads actual trained weights — never before then.
"""

from .schemas import DatasetStatusResponse, ModelStatusResponse

MODEL_STATUS = ModelStatusResponse(
    available=False,
    name="Diabetic retinopathy classifier",
    version=None,
    architecture=None,
    task="5-class DR severity grading (No DR / Mild / Moderate / Severe / Proliferative)",
    trained_on=None,
    note=(
        "No trained model is connected yet. Uploaded images are validated "
        "and preprocessed, but no prediction is produced."
    ),
)

DATASET_STATUS = DatasetStatusResponse(
    name=None,
    license=None,
    num_images=None,
    note=(
        "No dataset has been integrated yet. See DATASET.md for candidate "
        "public datasets under consideration."
    ),
)
