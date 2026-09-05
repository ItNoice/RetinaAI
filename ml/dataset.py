"""PyTorch Dataset for the DDR grading subset — layout documented in DATASET.md."""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image, UnidentifiedImageError
from torch.utils.data import Dataset

from ml.preprocessing import crop_to_fundus, normalize_image, resize_image

logger = logging.getLogger(__name__)

# DDR's "ungradable" grade. Dropped: the model only predicts the 5 ICDR ones.
UNGRADABLE_LABEL = 5


@dataclass
class Sample:
    image_path: Path
    label: int


def load_split(root: Path, split: str, max_per_class: int | None = None) -> list[Sample]:
    """Read `<root>/<split>.txt` and return the samples whose images exist."""
    label_file = root / f"{split}.txt"
    image_dir = root / split

    if not label_file.exists():
        raise FileNotFoundError(
            f"No label file at {label_file}. Check --data-root points at "
            f"DR_grading/ — see DATASET.md."
        )

    per_class: dict[int, list[Sample]] = {}
    malformed = 0
    missing = 0

    with open(label_file, encoding="utf-8") as f:
        for line in f:
            parts = line.split()  # "filename label"
            if len(parts) != 2:
                if line.strip():  # trailing blank lines are normal, anything else isn't
                    malformed += 1
                continue

            filename, label_str = parts
            try:
                label = int(label_str)
            except ValueError:
                malformed += 1
                continue

            if label == UNGRADABLE_LABEL:
                continue

            image_path = image_dir / filename
            if not image_path.exists():
                missing += 1  # usually a partial download
                continue

            per_class.setdefault(label, []).append(Sample(image_path, label))

    if malformed or missing:
        # Silently training on half a dataset just gives you a quietly worse model.
        logger.warning(
            "%s: skipped %d malformed line(s) and %d image(s) listed but not on disk",
            label_file.name,
            malformed,
            missing,
        )

    samples: list[Sample] = []
    for label, class_samples in sorted(per_class.items()):
        # Cap per class, not overall: the file is ordered and "No DR" dominates
        # it, so a flat cap would leave almost no severe cases in the set.
        samples.extend(class_samples[:max_per_class])
    return samples


class DDRGradingDataset(Dataset):
    """Same preprocessing as the serving path, minus the validation."""

    def __init__(self, samples: list[Sample], image_size: int = 224):
        self.samples = samples
        self.image_size = image_size

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        sample = self.samples[idx]

        try:
            with Image.open(sample.image_path) as image:
                rgb = np.array(image.convert("RGB"))
        except (UnidentifiedImageError, OSError) as exc:
            # Name the file — a bare OSError from a DataLoader worker is useless.
            raise RuntimeError(f"Could not read {sample.image_path}") from exc

        cropped = crop_to_fundus(rgb)
        resized = resize_image(cropped, self.image_size)
        normalized = normalize_image(resized)
        return normalized.astype(np.float32), sample.label
