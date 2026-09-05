"""Model architecture for the diabetic retinopathy classifier.

ResNet-18 with an ImageNet-pretrained backbone. The small backbone is a
deliberate choice, not a default: this project trains and serves on CPU
only (see ml/train.py), and anything larger pushes a single epoch past the
point of being useful to iterate on.
"""

from __future__ import annotations

import torch.nn as nn
from torchvision.models import ResNet18_Weights, resnet18

from ml.types import DR_CLASSES

ARCHITECTURE_NAME = "resnet18"


def create_model(num_classes: int = len(DR_CLASSES), freeze_backbone: bool = True) -> nn.Module:
    """Build a ResNet-18 with a fresh `num_classes`-way head.

    With `freeze_backbone`, only layer4 and the head train. That trades some
    accuracy for a fine-tune that finishes on CPU; pass False when loading a
    checkpoint for inference, where the flag is irrelevant anyway.
    """
    model = resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)

    if freeze_backbone:
        # Freeze everything, then thaw the last residual block. The early
        # layers are generic edge/texture detectors that transfer to fundus
        # photos as-is; layer4 is where ImageNet-specific semantics live and
        # where the retinal features have to be learned.
        for param in model.parameters():
            param.requires_grad = False
        for param in model.layer4.parameters():
            param.requires_grad = True

    # Swap ImageNet's 1000-way head for our 5-way one.
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model
