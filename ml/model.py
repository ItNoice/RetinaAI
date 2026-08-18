"""Model architecture for the diabetic retinopathy classifier.

Transfer learning on an ImageNet-pretrained ResNet-18 backbone, per the
spec's preference for transfer learning over training a large network from
scratch. ResNet-18 (rather than a larger EfficientNet/DenseNet variant) is
chosen specifically because this project trains on CPU only — see
ml/train.py — where a smaller backbone keeps an epoch tractable.
"""

from __future__ import annotations

import torch.nn as nn
from torchvision.models import ResNet18_Weights, resnet18

from ml.types import DR_CLASSES

ARCHITECTURE_NAME = "resnet18"


def create_model(num_classes: int = len(DR_CLASSES), freeze_backbone: bool = True) -> nn.Module:
    """Builds a ResNet-18 with an ImageNet-pretrained backbone and a fresh
    `num_classes`-way head. When `freeze_backbone` is True, only the final
    residual block (layer4) and the classification head are trainable —
    this is what makes fine-tuning feasible on CPU in a reasonable amount of
    time, at some cost to final accuracy versus full fine-tuning.
    """
    model = resnet18(weights=ResNet18_Weights.IMAGENET1K_V1)

    if freeze_backbone:
        for param in model.parameters():
            param.requires_grad = False
        for param in model.layer4.parameters():
            param.requires_grad = True

    in_features = model.fc.in_features
    model.fc = nn.Linear(in_features, num_classes)
    return model
