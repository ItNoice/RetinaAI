"""Fine-tune the diabetic retinopathy classifier on the DDR grading subset.

Runs on CPU. That constraint drives most of what looks unusual here: the
backbone is mostly frozen (ml/model.py), the dataset is subsampled per class
via --max-per-class-*, and epoch counts are small. It's an honest research
prototype, not a production training run, and the metadata written into the
checkpoint says so.

Uses DDR's own train/valid split — the test split is never touched here, not
even for checkpoint selection, so ml/evaluate.py has something genuinely
held out to report on.

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

from ml.dataset import DDRGradingDataset, Sample, load_split
from ml.model import ARCHITECTURE_NAME, create_model
from ml.types import DR_CLASSES

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MODEL_PATH = REPO_ROOT / "models" / "dr_classifier.pt"


def compute_class_weights(samples: list[Sample], num_classes: int) -> torch.Tensor:
    """Inverse-frequency weights for the loss.

    DDR is dominated by "No DR". Unweighted, the model learns to predict it
    unconditionally and scores a deceptively good accuracy while being
    useless for the grades that actually matter clinically.
    """
    counts = Counter(s.label for s in samples)
    total = sum(counts.values())
    # counts.get(i, 1) rather than 0: a class absent from a subsample would
    # otherwise divide by zero. Its weight is meaningless either way.
    weights = [total / (num_classes * counts.get(i, 1)) for i in range(num_classes)]
    return torch.tensor(weights, dtype=torch.float32)


def run_epoch(model, loader, criterion, optimizer, device, train: bool) -> tuple[float, float]:
    """One pass over `loader`. Returns (mean loss, accuracy)."""
    model.train(mode=train)

    total_loss = 0.0
    correct = 0
    total = 0

    grad_context = torch.enable_grad() if train else torch.no_grad()
    with grad_context:
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

            # Weight by batch size so a short final batch doesn't skew the mean.
            total_loss += loss.item() * images.size(0)
            correct += (outputs.argmax(dim=1) == labels).sum().item()
            total += images.size(0)

    # max(total, 1) guards the empty-loader case; callers already reject it,
    # but a ZeroDivisionError here would be a miserable way to find out.
    return total_loss / max(total, 1), correct / max(total, 1)


def parse_args() -> argparse.Namespace:
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
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    if not args.data_root.is_dir():
        raise SystemExit(f"--data-root {args.data_root} does not exist. See DATASET.md.")

    device = torch.device("cpu")

    train_samples = load_split(args.data_root, "train", max_per_class=args.max_per_class_train)
    valid_samples = load_split(args.data_root, "valid", max_per_class=args.max_per_class_valid)
    if not train_samples or not valid_samples:
        raise SystemExit(
            f"Found {len(train_samples)} train / {len(valid_samples)} valid samples. "
            f"The label files under {args.data_root} exist but the images they "
            "reference don't — likely a partial download."
        )

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
    criterion = nn.CrossEntropyLoss(weight=compute_class_weights(train_samples, len(DR_CLASSES)))
    # Only the unfrozen parameters go to the optimizer — handing it frozen
    # ones works, but hides the fact that most of the network isn't training.
    trainable_params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.Adam(trainable_params, lr=args.lr)

    print(f"Train samples: {len(train_samples)} | Valid samples: {len(valid_samples)}")
    print(f"Class distribution (train): {dict(Counter(s.label for s in train_samples))}")

    best_val_acc = 0.0
    history = []
    start_time = time.time()

    for epoch in range(1, args.epochs + 1):
        epoch_start = time.time()
        train_loss, train_acc = run_epoch(
            model, train_loader, criterion, optimizer, device, train=True
        )
        val_loss, val_acc = run_epoch(
            model, valid_loader, criterion, optimizer, device, train=False
        )
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

        # >= rather than >: with few epochs and a small valid set, a later
        # epoch that ties is usually the better-converged one to keep.
        if val_acc >= best_val_acc:
            best_val_acc = val_acc
            save_checkpoint(model, args, epoch, best_val_acc, train_samples, valid_samples)
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


def save_checkpoint(model, args, epoch, best_val_acc, train_samples, valid_samples) -> None:
    """Write the checkpoint, provenance included.

    The dataset/sample-count fields aren't decoration: the backend reads them
    back out to report what the deployed model was actually trained on, and
    an unlabelled .pt file is how you end up unable to answer that later.
    """
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


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        # Ctrl-C during a long CPU epoch is expected, not a crash. The last
        # checkpoint that improved val_acc is already on disk.
        print("\nInterrupted. The most recent improving checkpoint was kept.")
