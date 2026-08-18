"""Live model/dataset status, backed by whatever is actually on disk.

Mirrors app/frontend/src/lib/modelStatus.ts's shape. Before a checkpoint
exists at ml.inference.MODEL_PATH, `model_status()` reports `available:
False` — never a fabricated architecture/version.
"""

from ml.inference import get_model_info

from .schemas import DatasetStatusResponse, ModelStatusResponse

TASK_DESCRIPTION = (
    "5-class DR severity grading (No DR / Mild / Moderate / Severe / Proliferative)"
)

DATASET_STATUS = DatasetStatusResponse(
    name="DDR grading subset",
    license="CC BY 4.0",
    num_images=None,
    note=(
        "Trained on a stratified subset of the DDR dataset's grading split "
        "(compute-constrained: CPU-only training). See DATASET.md for the "
        "exact counts used and full provenance."
    ),
)

_UNAVAILABLE_DATASET_STATUS = DatasetStatusResponse(
    name=None,
    license=None,
    num_images=None,
    note=(
        "No dataset has been integrated yet. See DATASET.md for candidate "
        "public datasets under consideration."
    ),
)


def model_status() -> ModelStatusResponse:
    info = get_model_info()
    if not info.available:
        return ModelStatusResponse(
            available=False,
            name="Diabetic retinopathy classifier",
            version=None,
            architecture=None,
            task=TASK_DESCRIPTION,
            trained_on=None,
            note=(
                "No trained model is connected yet. Uploaded images are "
                "validated and preprocessed, but no prediction is produced."
            ),
        )
    return ModelStatusResponse(
        available=True,
        name="Diabetic retinopathy classifier",
        version=info.version,
        architecture=info.architecture,
        task=TASK_DESCRIPTION,
        trained_on=info.trained_on,
        note=(
            "Experimental research model. Predictions are not a medical "
            "diagnosis — see the About & Safety page."
        ),
    )


def dataset_status() -> DatasetStatusResponse:
    info = get_model_info()
    return DATASET_STATUS if info.available else _UNAVAILABLE_DATASET_STATUS
