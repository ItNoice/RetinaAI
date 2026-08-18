"""Computes real evaluation metrics for the trained diabetic retinopathy
classifier on a held-out split (DDR's own test set — never seen during
training or checkpoint selection).

Writes models/eval_metrics.json, consumed by the backend's Research
endpoints. If no checkpoint exists, this script has nothing to evaluate and
exits with an error rather than writing fabricated numbers.

Usage:
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


def evaluate(model_path: Path, data_root: Path, split: str, image_size: int, batch_size: int, max_per_class: int | None):
    if not model_path.exists():
        raise SystemExit(
            f"No checkpoint at {model_path}. Run ml/train.py first — "
            "there is nothing real to evaluate yet."
        )

    checkpoint = torch.load(model_path, map_location="cpu", weights_only=False)
    model = create_model(num_classes=checkpoint["num_classes"], freeze_backbone=False)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    samples = load_split(data_root, split, max_per_class=max_per_class)
    if not samples:
        raise SystemExit(f"No samples found for split '{split}' under {data_root}.")

    loader = DataLoader(
        DDRGradingDataset(samples, image_size), batch_size=batch_size, shuffle=False
    )

    all_labels: list[int] = []
    all_preds: list[int] = []
    all_probs: list[list[float]] = []

    with torch.no_grad():
        for images, labels in loader:
            logits = model(images)
            probs = torch.softmax(logits, dim=1).numpy()
            preds = probs.argmax(axis=1)
            all_labels.extend(labels.numpy().tolist())
            all_preds.extend(preds.tolist())
            all_probs.extend(probs.tolist())

    y_true = np.array(all_labels)
    y_pred = np.array(all_preds)
    y_probs = np.array(all_probs)
    class_names = checkpoint["class_names"]

    accuracy = float((y_true == y_pred).mean())
    precision_macro = float(precision_score(y_true, y_pred, average="macro", zero_division=0))
    recall_macro = float(recall_score(y_true, y_pred, average="macro", zero_division=0))
    f1_macro = float(f1_score(y_true, y_pred, average="macro", zero_division=0))
    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(class_names)))).tolist()

    roc_auc = None
    present_classes = sorted(set(y_true.tolist()))
    if len(present_classes) > 1:
        try:
            roc_auc = float(
                roc_auc_score(y_true, y_probs, multi_class="ovr", average="macro", labels=list(range(len(class_names))))
            )
        except ValueError:
            roc_auc = None

    return {
        "split": split,
        "dataset": checkpoint["trained_on"],
        "model_version": f"{checkpoint['architecture']}-epoch{checkpoint['epoch']}",
        "num_images_evaluated": len(samples),
        "class_distribution": {
            class_names[k]: v for k, v in sorted(Counter(all_labels).items())
        },
        "accuracy": accuracy,
        "precision_macro": precision_macro,
        "recall_macro": recall_macro,
        "f1_macro": f1_macro,
        "roc_auc_macro": roc_auc,
        "confusion_matrix": cm,
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
        args.model_path, args.data_root, args.split, args.image_size, args.batch_size, args.max_per_class
    )

    existing: dict = {}
    if args.output.exists():
        existing = json.loads(args.output.read_text())
    existing[args.split] = metrics
    args.output.write_text(json.dumps(existing, indent=2))

    print(json.dumps(metrics, indent=2))
    print(f"\nWrote {args.split} metrics to {args.output}")


if __name__ == "__main__":
    main()
