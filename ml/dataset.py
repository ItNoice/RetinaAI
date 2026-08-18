"""PyTorch Dataset for the DDR diabetic retinopathy grading subset.

Expects the layout documented in DATASET.md: a `DR_grading/` directory with
`train/`, `valid/`, `test/` image folders, each paired with a label file of
`<filename> <label>` lines. Labels 0-4 follow the ICDR scale used throughout
this project (see ml.types.DR_CLASSES); label 5 ("ungradable") is excluded —
it isn't one of the five classes this model predicts.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image
from torch.utils.data import Dataset

from ml.preprocessing import crop_to_fundus, normalize_image, resize_image

UNGRADABLE_LABEL = 5


@dataclass
class Sample:
    image_path: Path
    label: int


def load_split(root: Path, split: str, max_per_class: int | None = None) -> list[Sample]:
    """Parses `<root>/<split>.txt` (whitespace-separated `filename label`
    lines) and returns Samples whose images actually exist in
    `<root>/<split>/`, excluding ungradable images. When `max_per_class` is
    set, each class is capped independently (a stratified cap) so rare
    classes aren't crowded out by "No DR" when subsampling for CPU-feasible
    training.
    """
    label_file = root / f"{split}.txt"
    image_dir = root / split

    per_class: dict[int, list[Sample]] = {}
    with open(label_file, encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) != 2:
                continue
            filename, label_str = parts
            label = int(label_str)
            if label == UNGRADABLE_LABEL:
                continue
            image_path = image_dir / filename
            if not image_path.exists():
                continue
            per_class.setdefault(label, []).append(Sample(image_path, label))

    samples: list[Sample] = []
    for label, class_samples in sorted(per_class.items()):
        if max_per_class is not None:
            class_samples = class_samples[:max_per_class]
        samples.extend(class_samples)
    return samples


class DDRGradingDataset(Dataset):
    def __init__(self, samples: list[Sample], image_size: int = 224):
        self.samples = samples
        self.image_size = image_size

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        sample = self.samples[idx]
        image = Image.open(sample.image_path).convert("RGB")
        rgb = np.array(image)
        cropped = crop_to_fundus(rgb)
        resized = resize_image(cropped, self.image_size)
        normalized = normalize_image(resized)
        return normalized.astype(np.float32), sample.label
