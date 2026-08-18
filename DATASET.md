# Dataset

## DDR (Diabetic Retinopathy Dataset)

- **Source**: [nkicsl/DDR-dataset](https://github.com/nkicsl/DDR-dataset) (Chinese Academy of Sciences); original paper:
  Li, T., Gao, Y., Wang, K., Guo, S., Liu, H., & Kang, H. (2019). "Diagnostic
  Assessment of Deep Learning Algorithms for Diabetic Retinopathy Screening."
  *Information Sciences*, 501, 511–522.
- **License**: CC BY 4.0 — permits reuse (including for a project like this
  one) with attribution. This was the deciding factor among the four
  datasets the project spec named: EyePACS's Kaggle competition rules
  explicitly prohibit redistribution (and the convenient third-party
  HuggingFace mirrors of it appear to violate that), APTOS 2019 requires a
  Kaggle account/API token to download, and Messidor-2 requires manual
  registration through ADCIS. DDR was the only one of the four that could be
  downloaded and used without credentials this project doesn't have or
  registration it can't automate.
- **What was downloaded**: the full DDR archive (~12.3GB, from the Google
  Drive link in the repo above) contains three subtasks — DR grading,
  lesion segmentation, and lesion detection. Only the **`DR_grading/`**
  subset is used here; this project does not need pixel-level lesion
  annotations.
- **Classes**: 6 labels on the ICDR (International Clinical Diabetic
  Retinopathy) scale — 0 (No DR), 1 (Mild), 2 (Moderate), 3 (Severe), 4
  (Proliferative DR), and 5 (ungradable). Label 5 is excluded — it isn't a
  DR severity class, and this project's task is 5-class severity grading
  (see `ml/types.py::DR_CLASSES`).
- **Full grading-subset size**: 13,673 images total, with DDR's own
  train/valid/test split:

  | Split | No DR (0) | Mild (1) | Moderate (2) | Severe (3) | Proliferative (4) | Ungradable (5, excluded) | Total used |
  |---|---|---|---|---|---|---|---|
  | train | 3,133 | 315 | 2,238 | 118 | 456 | 575 | 6,260 |
  | valid | 1,253 | 126 | 895 | 47 | 182 | 230 | 2,503 |
  | test | 1,880 | 189 | 1,344 | 71 | 275 | 346 | 3,759 |

  Note the severe class imbalance — "No DR" and "Moderate" dominate, while
  "Severe" is rare (only 118 training images). This is typical of DR
  screening datasets and is handled with inverse-frequency class weighting
  in `ml/train.py`, not by ignoring it.

- **Compute constraint — subsampling**: this project trains on CPU only (no
  GPU is available in this environment). Rather than silently taking longer
  or quietly using less data, `ml/train.py` explicitly caps each class at a
  configurable maximum per split (`--max-per-class-train`,
  `--max-per-class-valid`) via **stratified** subsampling — every class is
  capped independently, not the dataset as a whole, so rare classes like
  "Severe" aren't crowded out. The model actually shipped in this repo
  (`models/dr_classifier.pt`) was trained with `--max-per-class-train 600
  --max-per-class-valid 150`, giving 2,089 training images and up to 623
  validation images per run — see `models/train_log.json` for the exact
  run. **Evaluation** (`ml/evaluate.py`) is run against the **full, uncapped
  test split** (up to 3,759 images) so reported metrics reflect real
  performance on held-out data, not a cherry-picked subset.

- **Preprocessing performed** (`ml/preprocessing.py`, shared by training and
  serving): crop to the fundus circle's bounding box (removes the black
  surround), resize to 224×224, ImageNet mean/std normalization for
  compatibility with the pretrained ResNet-18 backbone.

- **Intended research use**: educational/research prototype only, consistent
  with this project's [About & Safety page](app/frontend/src/pages/About.tsx)
  disclaimers. Not used, and not suitable, for clinical decision-making.

Raw and extracted DDR files live under `datasets/ddr_raw/` on this machine
and are **not** committed to the repository (see `.gitignore`) — only this
document and the code that consumes the data are version-controlled.

## Other datasets considered (not used)

| Dataset | Why not used |
|---|---|
| EyePACS | Original Kaggle competition rules prohibit redistribution; third-party mirrors of the raw images appear to violate that restriction. |
| APTOS 2019 Blindness Detection | Requires a Kaggle account and API token to download; this project doesn't collect or handle user credentials. |
| Messidor / Messidor-2 | Requires manual registration through ADCIS; not automatable without a human completing that registration. |
