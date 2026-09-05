"""ResNet-18 classifier for diabetic retinopathy grading."""

from __future__ import annotations

import torch.nn as nn
from torchvision.models import ResNet18_Weights, resnet18

from ml.types import DR_CLASSES

# ResNet-18 and not something larger: this project trains on CPU only.
ARCHITECTURE_NAME = "resnet18"


def create_model(num_classes: int = len(DR_CLASSES), freeze_backbone: bool = True) -> nn.Module:
    """Build a ResNet-18 with a fresh `num_classes`-way head."""
    model = resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)

    if freeze_backbone:
        for param in model.parameters():
            param.requires_grad = False  # freeze everything...
        for param in model.layer4.parameters():
            param.requires_grad = True  # ...then thaw the last block, where the retinal features get learned

    # ImageNet's 1000-way head is useless to us; swap in a 5-way one.
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model
