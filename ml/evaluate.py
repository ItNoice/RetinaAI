"""Score the trained classifier on a held-out split, writing models/eval_metrics.json.

    python -m ml.evaluate --data-root datasets/ddr_raw/DR_grading --split test
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import (
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from torch.utils.data import DataLoader

from ml.dataset import DDRGradingDataset, load_split
from ml.model import create_model

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL_PATH = REPO_ROOT / "models" / "dr_classifier.pt"
DEFAULT_OUTPUT_PATH = REPO_ROOT / "models" / "eval_metrics.json"


def load_checkpoint(model_path: Path) -> tuple[torch.nn.Module, dict]:
    # Exit rather than write anything: invented metrics are worse than none.
    if not model_path.exists():
        raise SystemExit(
            f"No checkpoint at {model_path}. Run ml/train.py first — there is "
            "nothing real to evaluate yet."
        )

    checkpoint = torch.load(model_path, map_location="cpu", weights_only=False)
    # freeze_backbone is irrelevant: load_state_dict overwrites the weights anyway.
    model = create_model(num_classes=checkpoint["num_classes"], freeze_backbone=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    return model, checkpoint


def collect_predictions(model: torch.nn.Module, loader: DataLoader):
    """Run the split through the model, returning (labels, preds, probs)."""
    labels_out: list[int] = []
    preds_out: list[int] = []
    probs_out: list[list[float]] = []

    with torch.no_grad():
        for images, labels in loader:
            probs = torch.softmax(model(images), dim=1).numpy()  # roc_auc_score needs scores that sum to 1, not logits
            labels_out.extend(labels.numpy().tolist())
            preds_out.extend(probs.argmax(axis=1).tolist())
            probs_out.extend(probs.tolist())

    return np.array(labels_out), np.array(preds_out), np.array(probs_out)


def macro_roc_auc(y_true: np.ndarray, y_probs: np.ndarray, num_classes: int) -> float | None:
    """One-vs-rest macro ROC-AUC, or None when it isn't defined."""
    # A capped or small split can miss a class entirely. The frontend renders
    # None as "not available" rather than showing a made-up number.
    if len(set(y_true.tolist())) < 2:
        return None

    try:
        return float(
            roc_auc_score(
                y_true,
                y_probs,
                multi_class="ovr",
                average="macro",
                labels=list(range(num_classes)),
            )
        )
    except ValueError:
        return None


def evaluate(
    model_path: Path,
    data_root: Path,
    split: str,
    image_size: int,
    batch_size: int,
    max_per_class: int | None,
) -> dict:
    model, checkpoint = load_checkpoint(model_path)
    class_names = checkpoint["class_names"]

    samples = load_split(data_root, split, max_per_class=max_per_class)
    if not samples:
        raise SystemExit(f"No samples found for split '{split}' under {data_root}.")

    loader = DataLoader(
        DDRGradingDataset(samples, image_size), batch_size=batch_size, shuffle=False
    )
    y_true, y_pred, y_probs = collect_predictions(model, loader)

    # Macro averaging throughout — a micro-average here is just "No DR".
    return {
        "split": split,
        "dataset": checkpoint["trained_on"],
        "model_version": f"{checkpoint['architecture']}-epoch{checkpoint['epoch']}",
        "num_images_evaluated": len(samples),
        "class_distribution": {
            class_names[label]: count for label, count in sorted(Counter(y_true.tolist()).items())
        },
        "accuracy": float((y_true == y_pred).mean()),
        "precision_macro": float(precision_score(y_true, y_pred, average="macro", zero_division=0)),
        "recall_macro": float(recall_score(y_true, y_pred, average="macro", zero_division=0)),
        "f1_macro": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
        "roc_auc_macro": macro_roc_auc(y_true, y_probs, len(class_names)),
        "confusion_matrix": confusion_matrix(
            y_true, y_pred, labels=list(range(len(class_names)))
        ).tolist(),
        "class_names": class_names,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-root", type=Path, required=True)
    parser.add_argument("--split", choices=["train", "valid", "test"], default="test")
    parser.add_argument("--model-path", type=Path, default=DEFAULT_MODEL_PATH)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT_PATH)
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--max-per-class", type=int, default=None)
    args = parser.parse_args()

    metrics = evaluate(
        args.model_path,
        args.data_root,
        args.split,
        args.image_size,
        args.batch_size,
        args.max_per_class,
    )

    # Merge, don't replace: each split is a separate run of this script.
    existing: dict = {}
    if args.output.exists():
        try:
            existing = json.loads(args.output.read_text())
        except json.JSONDecodeError:
            print(f"Warning: {args.output} was unreadable; starting a fresh file.")

    existing[args.split] = metrics
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(existing, indent=2))

    print(json.dumps(metrics, indent=2))
    print(f"\nWrote {args.split} metrics to {args.output}")


if __name__ == "__main__":
    main()
