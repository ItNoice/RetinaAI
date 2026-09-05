"""Grad-CAM heatmaps (Selvaraju et al., 2017) for the retinal classifier."""

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
    """Heatmap for `target_class_idx` as PNG bytes, same H×W as the input.

    A map of where the model looked, not where disease is. The two often
    coincide and sometimes badly don't.
    """
    # layer4: deep enough to carry class information, still spatial enough to localize.
    target_layers = [model.layer4[-1]]

    # Must be the array the model actually scored (preprocess's `.normalized`),
    # not the raw upload — otherwise the heatmap describes a frame it never saw.
    input_tensor = torch.from_numpy(normalized_image).unsqueeze(0)
    with GradCAM(model=model, target_layers=target_layers) as cam:
        grayscale_cam = cam(
            input_tensor=input_tensor,
            targets=[ClassifierOutputTarget(target_class_idx)],
        )[0]  # one map per batch item, and we pass one image; (H, W) float32 in [0, 1]

    heatmap_bgr = cv2.applyColorMap(np.uint8(255 * grayscale_cam), cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)  # OpenCV is BGR; Pillow would swap red and blue

    # Returned bare, with no source image blended in, so the frontend can
    # composite it at an adjustable opacity.
    buffer = BytesIO()
    Image.fromarray(heatmap_rgb).save(buffer, format="PNG")
    return buffer.getvalue()
