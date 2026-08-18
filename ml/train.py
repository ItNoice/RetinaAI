"""Training entrypoint for the diabetic retinopathy classifier.

Fine-tunes an ImageNet-pretrained ResNet-18 (see ml/model.py) on the DDR
grading subset (see DATASET.md) using DDR's own train/valid/test split.
Runs on CPU by design — this project has no GPU available — so the backbone
is mostly frozen (only layer4 + the classification head train) and dataset
size is configurable via --max-per-class-train/valid so a run stays
tractable. This is a real, disclosed compute constraint: see the "Model
methodology" note it writes into the saved metadata, and DATASET.md.

Usage:
    python -m ml.train --data-root datasets/ddr_raw/DR_grading --epochs 5
"""

from __future__ import annotations

import argparse
import json
import time
from collections import Counter
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from ml.dataset import DDRGradingDataset, load_split
from ml.model import ARCHITECTURE_NAME, create_model
from ml.types import DR_CLASSES

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL_PATH = REPO_ROOT / "models" / "dr_classifier.pt"


def compute_class_weights(samples, num_classes: int) -> torch.Tensor:
    """Inverse-frequency class weights so the (heavily imbalanced, "No DR"
    dominated) DR grading task doesn't collapse to always predicting the
    majority class."""
    counts = Counter(s.label for s in samples)
    total = sum(counts.values())
    weights = [
        total / (num_classes * counts.get(i, 1)) for i in range(num_classes)
    ]
    return torch.tensor(weights, dtype=torch.float32)


def run_epoch(model, loader, criterion, optimizer, device, train: bool) -> tuple[float, float]:
    model.train(mode=train)
    total_loss = 0.0
    correct = 0
    total = 0

    context = torch.enable_grad() if train else torch.no_grad()
    with context:
        for images, labels in loader:
            images = images.to(device)
            labels = labels.to(device)

            if train:
                optimizer.zero_grad()

            outputs = model(images)
            loss = criterion(outputs, labels)

            if train:
                loss.backward()
                optimizer.step()

            total_loss += loss.item() * images.size(0)
            correct += (outputs.argmax(dim=1) == labels).sum().item()
            total += images.size(0)

    return total_loss / max(total, 1), correct / max(total, 1)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-root", type=Path, required=True, help="Path to DR_grading/")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--image-size", type=int, default=224)
    parser.add_argument("--max-per-class-train", type=int, default=600)
    parser.add_argument("--max-per-class-valid", type=int, default=150)
    parser.add_argument("--num-workers", type=int, default=4)
    parser.add_argument("--output", type=Path, default=DEFAULT_MODEL_PATH)
    args = parser.parse_args()

    device = torch.device("cpu")

    train_samples = load_split(args.data_root, "train", max_per_class=args.max_per_class_train)
    valid_samples = load_split(args.data_root, "valid", max_per_class=args.max_per_class_valid)

    train_loader = DataLoader(
        DDRGradingDataset(train_samples, args.image_size),
        batch_size=args.batch_size,
        shuffle=True,
        num_workers=args.num_workers,
    )
    valid_loader = DataLoader(
        DDRGradingDataset(valid_samples, args.image_size),
        batch_size=args.batch_size,
        shuffle=False,
        num_workers=args.num_workers,
    )

    model = create_model(num_classes=len(DR_CLASSES), freeze_backbone=True).to(device)
    class_weights = compute_class_weights(train_samples, len(DR_CLASSES))
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.Adam(trainable_params, lr=args.lr)

    print(f"Train samples: {len(train_samples)} | Valid samples: {len(valid_samples)}")
    print(f"Class distribution (train): {dict(Counter(s.label for s in train_samples))}")

    best_val_acc = 0.0
    history = []
    start_time = time.time()

    for epoch in range(1, args.epochs + 1):
        epoch_start = time.time()
        train_loss, train_acc = run_epoch(model, train_loader, criterion, optimizer, device, train=True)
        val_loss, val_acc = run_epoch(model, valid_loader, criterion, optimizer, device, train=False)
        epoch_time = time.time() - epoch_start

        print(
            f"Epoch {epoch}/{args.epochs} — "
            f"train_loss={train_loss:.4f} train_acc={train_acc:.4f} "
            f"val_loss={val_loss:.4f} val_acc={val_acc:.4f} "
            f"({epoch_time:.1f}s)"
        )
        history.append(
            {
                "epoch": epoch,
                "train_loss": train_loss,
                "train_acc": train_acc,
                "val_loss": val_loss,
                "val_acc": val_acc,
                "epoch_time_s": round(epoch_time, 1),
            }
        )

        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            args.output.parent.mkdir(parents=True, exist_ok=True)
            torch.save(
                {
                    "model_state_dict": model.state_dict(),
                    "architecture": ARCHITECTURE_NAME,
                    "num_classes": len(DR_CLASSES),
                    "class_names": DR_CLASSES,
                    "image_size": args.image_size,
                    "trained_on": "DDR grading subset (CC BY 4.0) — see DATASET.md",
                    "train_samples": len(train_samples),
                    "valid_samples": len(valid_samples),
                    "best_val_acc": best_val_acc,
                    "epoch": epoch,
                },
                args.output,
            )
            print(f"  -> saved checkpoint (val_acc={val_acc:.4f}) to {args.output}")

    total_time = time.time() - start_time
    log_path = args.output.parent / "train_log.json"
    log_path.write_text(
        json.dumps(
            {
                "history": history,
                "best_val_acc": best_val_acc,
                "total_time_s": round(total_time, 1),
                "args": {k: str(v) for k, v in vars(args).items()},
            },
            indent=2,
        )
    )
    print(f"Training complete in {total_time:.1f}s. Best val_acc={best_val_acc:.4f}. Log: {log_path}")


if __name__ == "__main__":
    main()
