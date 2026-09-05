"""Grad-CAM heatmaps for the retinal classifier.

Grad-CAM (Selvaraju et al., 2017) over layer4 of the ResNet-18 backbone —
the last conv block, which is the usual choice: deep enough to carry class
information, still spatial enough to localize.

Worth being blunt about what this is: a map of where the model looked, not a
map of where disease is. The two often coincide and sometimes badly don't.
The frontend shows it with that caveat attached.
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
    """Heatmap for `target_class_idx` as PNG bytes, same H×W as the input.

    `normalized_image` must be the (3, H, W) array the model actually saw —
    ml.preprocessing.preprocess's `.normalized`. Feeding it the raw upload
    produces a heatmap for a frame the model never scored.

    The heatmap is returned on its own, with no source image blended in:
    the frontend composites it over the preview itself so the overlay opacity
    stays adjustable client-side.
    """
    target_layers = [model.layer4[-1]]

    input_tensor = torch.from_numpy(normalized_image).unsqueeze(0)
    with GradCAM(model=model, target_layers=target_layers) as cam:
        # cam() returns one map per batch item; we only ever pass one image.
        grayscale_cam = cam(
            input_tensor=input_tensor,
            targets=[ClassifierOutputTarget(target_class_idx)],
        )[0]  # (H, W), float32 in [0, 1]

    # JET is the convention readers expect from published Grad-CAM figures.
    # OpenCV hands back BGR, so convert before Pillow sees it or the heatmap
    # comes out with its red and blue ends swapped.
    heatmap_bgr = cv2.applyColorMap(np.uint8(255 * grayscale_cam), cv2.COLORMAP_JET)
    heatmap_rgb = cv2.cvtColor(heatmap_bgr, cv2.COLOR_BGR2RGB)

    buffer = BytesIO()
    Image.fromarray(heatmap_rgb).save(buffer, format="PNG")
    return buffer.getvalue()
