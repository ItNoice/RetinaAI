"""Grad-CAM explainability for the retinal classifier.

Produces a heatmap over the regions of the *preprocessed* (cropped +
resized) image that contributed most to the model's prediction for its
predicted class — using Grad-CAM (Selvaraju et al., 2017) on the last
convolutional block of the ResNet-18 backbone (ml/model.py).

This does not prove that highlighted regions contain disease — Grad-CAM
shows what the model attended to, not ground truth pathology. See the
disclaimer surfaced alongside it in the frontend.
"""

from __future__ import annotations

from io import BytesIO

import cv2
import numpy as np
import torch
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget


def generate_gradcam_png(
    model: torch.nn.Module, normalized_image: np.ndarray, target_class_idx: int
) -> bytes:
    """`normalized_image` is the (3, H, W) ImageNet-normalized array the
    model actually saw (ml.preprocessing.preprocess's `.normalized`).
    Returns a colorized heatmap as PNG bytes, same H×W as the input, with no
    original image blended in — the frontend composites it over the
    preprocessed preview image itself, with an adjustable opacity slider.
    """
    target_layers = [model.layer4[-1]]

    input_tensor = torch.from_numpy(normalized_image).unsqueeze(0)
    with GradCAM(model=model, target_layers=target_layers) as cam:
        grayscale_cam = cam(
            input_tensor=input_tensor,
            targets=[ClassifierOutputTarget(target_class_idx)],
        )[0]  # (H, W) float32 in [0, 1]

    heatmap_bgr = cv2.applyColorMap(np.uint8(255 * grayscale_cam), cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)

    buffer = BytesIO()
    Image.fromarray(heatmap_rgb).save(buffer, format="PNG")
    return buffer.getvalue()
