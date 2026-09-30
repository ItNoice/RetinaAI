# RetinaAI

Hello! I'm Bilal, I used AI to debug and help, because this is my first biomedical program! I'm very proud of this. I acknowledge my use of AI and only used it because it was my first project and didn't know where to start. From now on I'm trying to learn to do this all by myself, and only use AI as it's intended use, a tool. 
Thank you!

A research prototype for AI-assisted analysis of retinal fundus photographs,
starting with diabetic retinopathy (DR) severity grading. Built end-to-end —
real dataset, real model, real training run, real evaluation metrics, real
Grad-CAM explanations — as a demonstration of how ophthalmology, medical
imaging, and applied machine learning fit together in a small but complete
software system.

> [!WARNING]
> **This project is an educational and research prototype. It is not a
> medical device and should not be used to diagnose, treat, or make clinical
> decisions about any person.** Model predictions may be incorrect, and
> performance may differ across populations, cameras, image quality, and
> clinical settings. See [Limitations](#limitations) and
> [Ethical considerations](#ethical-considerations) below.

## Table of contents

1. [What this project does](#what-this-project-does)
2. [Why it was built this way](#why-it-was-built-this-way)
3. [Ophthalmology background](#ophthalmology-background)
4. [Dataset](#dataset)
5. [Machine-learning methodology](#machine-learning-methodology)
6. [Model architecture](#model-architecture)
7. [Training methodology](#training-methodology)
8. [Evaluation methodology](#evaluation-methodology)
9. [Explainable AI (Grad-CAM)](#explainable-ai-grad-cam)
10. [Limitations](#limitations)
11. [Installation](#installation)
12. [Running the application](#running-the-application)
13. [Training the model](#training-the-model)
14. [Running inference / evaluation directly](#running-inference--evaluation-directly)
15. [Ethical considerations](#ethical-considerations)

## What this project does

A user uploads a retinal fundus photograph. The application:

1. Validates the file (real image, readable, not absurdly small/large).
2. Preprocesses it (crops to the fundus circle, resizes, normalizes) —
   identically for training and for serving, via one shared module.
3. Runs it through a real, locally-trained diabetic retinopathy classifier
   (ResNet-18, transfer-learned).
4. Returns a predicted severity class with a full probability distribution.
5. Generates a Grad-CAM heatmap showing which regions of the *preprocessed*
   image most influenced that prediction.
6. Stores the analysis locally (browser IndexedDB) so multiple images can be
   compared later, with a one-click way to delete any or all of them.
7. Surfaces a Research dashboard with real accuracy/precision/recall/F1/
   ROC-AUC/confusion-matrix numbers, computed on a genuine held-out test
   split — never hard-coded.

Everything above is real: no step returns a hard-coded or fabricated result.
Where a real result isn't available (no model loaded, no evaluation run
yet), the UI says so explicitly instead of making something up.

## Why it was built this way

The brief behind this project was explicit about **research integrity**:
never fabricate a prediction, a metric, or a dataset claim. That constraint
shaped almost every engineering decision here — see
[DATASET.md](DATASET.md) for the dataset-licensing research this required,
and the phase-by-phase git history for how the project was built
incrementally, keeping the app functional (and honest about what it could
and couldn't do yet) at every stage.

## Ophthalmology background

Diabetic retinopathy is damage to the retina's blood vessels caused by
prolonged high blood sugar, and is one of the leading causes of preventable
blindness in adults. It's typically staged on the **International Clinical
Diabetic Retinopathy (ICDR) severity scale**, which this project's 5 output
classes follow directly:

| Class | Clinical meaning (informal) |
|---|---|
| No DR | No visible retinopathy |
| Mild | A few microaneurysms only |
| Moderate | More extensive microaneurysms/hemorrhages, short of severe |
| Severe | Extensive hemorrhages/venous beading/IRMA in multiple quadrants |
| Proliferative | Neovascularization or vitreous/preretinal hemorrhage — the most advanced, sight-threatening stage |

Screening relies on fundus photography — a camera pointed through the pupil
that images the retina — which is exactly the kind of image this
application accepts. Automated screening assistance is an active, real
research area (it's the basis of FDA-cleared systems like IDx-DR), which is
part of why DR grading was chosen as this prototype's first task; it is
**not** a claim that this specific model is anywhere near that bar (it
isn't — see [Limitations](#limitations)).

## Dataset

Full provenance, licensing research, and exact per-split counts are in
**[DATASET.md](DATASET.md)**. Summary: this project uses the **DDR
grading subset** (CC BY 4.0, 13,673 images), the only one of the four
datasets the original spec named — EyePACS, APTOS 2019, Messidor-2, DDR —
that could be downloaded and used without credentials this project doesn't
have (Kaggle) or manual registration it can't automate (ADCIS). No dataset
is bundled into this repository; `datasets/` is gitignored.

## Machine-learning methodology

```
Raw retinal images
        │
        ▼
Image validation           ml/preprocessing.py — format, size, corruption
        │
        ▼
Crop to fundus circle       removes the black surround around the photo
        │
        ▼
Resize (224×224)
        │
        ▼
ImageNet normalization      mean/std match the pretrained backbone
        │
        ▼
Train / valid / test split  DDR's own split — never re-shuffled
        │
        ▼
Model training              ml/train.py — transfer learning, CPU-only
        │
        ▼
Evaluation                  ml/evaluate.py — real held-out metrics
        │
        ▼
Model export                models/dr_classifier.pt (gitignored)
        │
        ▼
Web application inference   app/backend — FastAPI serves the same
                             preprocessing + model for real-time analysis
```

The same `ml/preprocessing.py` module runs in training (`ml/dataset.py`)
and in the backend (`app/backend/main.py`) — preprocessing can never
silently drift between what the model was trained on and what it sees in
production, because it's one function, not two implementations kept in
sync by hand.

## Model architecture

**ResNet-18** (`ml/model.py`), ImageNet-pretrained via `torchvision`, with
its final fully-connected layer replaced by a fresh 5-class head. Only
`layer4` (the last residual block) and the new head are trainable — the
rest of the backbone stays frozen.

This is a **transfer learning** setup, per the spec's explicit preference
for transfer learning over training a large network from scratch, and the
specific choice of ResNet-18 (over a larger EfficientNet/DenseNet variant)
and partial freezing is a direct consequence of one hard constraint: **this
project trains and serves on CPU only — there is no GPU in this
environment.** A larger, fully fine-tuned network simply wasn't tractable
here in a reasonable amount of time; see
[Training methodology](#training-methodology) for the actual numbers this
produced.

## Training methodology

`ml/train.py` fine-tunes on DDR's own train/valid split (never re-shuffled
by this project). Two real constraints shaped the training run:

- **CPU-only, so the dataset is stratified-subsampled.** `--max-per-class-train`
  and `--max-per-class-valid` cap each class *independently* (not the
  dataset as a whole), so rare classes like Severe (only 118 real training
  images) aren't crowded out by the much more common No DR/Moderate
  classes when the total is capped for CPU-feasible epoch times. The
  shipped model used `--max-per-class-train 600 --max-per-class-valid 150`
  → 2,089 training images, up to 623 validation images.
- **Severe class imbalance**, even after capping, is handled with
  inverse-frequency class weighting in the loss (`compute_class_weights` in
  `ml/train.py`) rather than ignored.

The actual run: 10 epochs, Adam optimizer (lr=1e-3) on the trainable
parameters only, batch size 16. Real per-epoch history is in
`models/train_log.json`. The checkpoint that shipped
(`models/dr_classifier.pt`, gitignored — see
[Installation](#installation) to regenerate it) is **not** the final
epoch's weights — it's whichever epoch had the best validation accuracy
(epoch 3, 59.9%), because training accuracy kept climbing (to 93.7% by
epoch 10) while validation accuracy degraded — textbook overfitting on a
small dataset with a partially-unfrozen backbone. Saving on best-val rather
than final-epoch is what makes the shipped checkpoint the epoch-3 one, not
a cherry-pick after the fact.

## Evaluation methodology

`ml/evaluate.py` computes accuracy, macro precision/recall/F1, macro
ROC-AUC (one-vs-rest), a confusion matrix, and the class distribution
actually evaluated — via scikit-learn, on real predictions from the loaded
checkpoint. It refuses to run (raises, doesn't write a file) if no
checkpoint exists, so there's no code path that can produce a metrics file
without a real model behind it.

**Train and valid metrics use the same capped subset actually used for
training/checkpoint selection** — expect them to look better than
real-world performance, especially train, which the model has literally
seen. **Test metrics use the full, uncapped, held-out test split (3,759
images)** the model never saw during training or checkpoint selection —
this is the honest number. Current real results (see
`models/eval_metrics.json` for the full breakdown including the confusion
matrix):

| Split | Images | Accuracy | Precision (macro) | Recall (macro) | F1 (macro) | ROC-AUC (macro) |
|---|---|---|---|---|---|---|
| Train | 2,089 | 80.5% | 81.6% | 84.6% | 81.1% | 97.3% |
| Valid | 2,503 | 49.8% | 45.7% | 55.3% | 41.7% | 82.8% |
| **Test** | **3,759** | **52.0%** | **46.7%** | **50.3%** | **44.0%** | **82.9%** |

For 5 balanced classes, random guessing would score ~20% accuracy, so the
model is learning real signal — but 52% test accuracy is a **modest**
research-prototype result, not a clinically usable one. The confusion
matrix (Research page, or `models/eval_metrics.json`) shows exactly where
it struggles: strong on No DR and Proliferative (the two visually most
distinct classes), weak distinguishing Mild from Moderate (frequently
confused in both directions) — consistent with the known difficulty of
that specific boundary in DR grading generally, compounded here by the
small, capped training set.

## Explainable AI (Grad-CAM)

`ml/explainability.py` runs Grad-CAM (Selvaraju et al., 2017) via
`pytorch-grad-cam`, hooked into the last convolutional block (`layer4`) of
the trained ResNet-18, targeting the model's own predicted class. The
result is a colorized heatmap the frontend lets you view alone, or as an
adjustable-opacity overlay, next to the original.

**One correctness detail that matters**: the heatmap's coordinates only
make sense relative to the *cropped and resized* 224×224 image the model
actually analyzed — not the original upload, which may have a different
aspect ratio and crop offset. The frontend's image viewer
(`ImageViewer.tsx`) accounts for this: "Original" mode shows the full
unmodified upload, while "Heatmap"/"Overlay" modes swap to the exact
preprocessed preview image the backend returned, so the heatmap is never
shown misaligned with what it's actually explaining.

As the UI states directly: *"Highlighted regions represent areas that
contributed more strongly to the model's prediction. This visualization
does not prove that these regions contain disease."* Grad-CAM shows what
the model attended to — not ground-truth pathology, and not proof of
anything.

## Limitations

- **Modest accuracy.** 52% test accuracy on 5 classes (vs. ~20% chance) —
  real signal, not a usable diagnostic tool. See
  [Evaluation methodology](#evaluation-methodology).
- **Small, capped training set.** CPU-only compute meant training on 2,089
  images (stratified-capped from DDR's full 6,260-image train split), not
  the full dataset.
- **Single dataset, single source.** Trained and evaluated entirely on DDR
  (Chinese hospital-sourced fundus photographs). Performance on other
  cameras, populations, or acquisition protocols is unknown and very
  plausibly worse — this is exactly the generalization gap that made
  EyePACS/APTOS/Messidor-2/DDR all show up as "the" DR datasets in the
  literature rather than one being universally sufficient.
- **Partially-frozen backbone.** Only `layer4` + the classification head
  were fine-tuned, trading some accuracy for CPU-feasible training time.
- **No external clinical validation.** No comparison against
  ophthalmologist grading on an independent cohort — a hard requirement for
  anything beyond a research prototype.
- **Grad-CAM is not a diagnosis.** It shows model attention, not lesion
  ground truth, and can highlight plausible-looking but clinically
  meaningless regions.
- **One condition.** Only diabetic retinopathy is implemented. The
  architecture is set up so glaucoma/AMD/cataract classifiers could be
  added as additional model heads or separate models later, but none exist
  yet — the UI never implies otherwise.

## Installation

Requires Python 3.11+ (developed and tested on 3.14) and Node 18+.

```bash
# Python backend + ML pipeline
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# torch/torchvision need the CPU-only index (this project has no GPU):
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Frontend
cd app/frontend
npm install
```

## Running the application

```bash
# Terminal 1 — backend (from repo root, with the venv active)
python -m uvicorn app.backend.main:app --reload --port 8000

# Terminal 2 — frontend
cd app/frontend
npm run dev
```

Open the URL Vite prints (typically http://localhost:5173). The frontend
works even without the backend running — uploads fall back to client-only
validation and the dashboard shows "model unavailable" — but real
predictions, Grad-CAM, and Research metrics all require the backend.

Without a trained checkpoint at `models/dr_classifier.pt`, the app is still
fully functional: images upload, validate, preprocess, and display
normally, and every "prediction" surface honestly reports "model
unavailable" instead of guessing. See [Training the model](#training-the-model)
to produce a real checkpoint.

## Training the model

Requires the DDR grading subset locally — see
[DATASET.md](DATASET.md) for the download/license details (not bundled in
this repo).

```bash
python -m ml.train \
  --data-root /path/to/DDR-dataset/DR_grading \
  --epochs 10 \
  --max-per-class-train 600 --max-per-class-valid 150

python -m ml.evaluate \
  --data-root /path/to/DDR-dataset/DR_grading \
  --split test
python -m ml.evaluate --data-root ... --split valid
python -m ml.evaluate --data-root ... --split train --max-per-class 600
```

`ml/train.py` saves the best-validation-accuracy checkpoint to
`models/dr_classifier.pt` (not the final epoch — see
[Training methodology](#training-methodology)) plus a full per-epoch log to
`models/train_log.json`. `ml/evaluate.py` appends each split's results into
`models/eval_metrics.json`, which both the backend's `/api/metrics`
endpoint and the frontend's Research page read directly — run it for a
split and that split's numbers update everywhere, automatically, from real
data.

## Running inference / evaluation directly

Outside the web app, `ml/inference.py` exposes `predict(normalized_image)`
for a single preprocessed image (returns `None` if no checkpoint is
loaded — never a fabricated result), and
`ml/explainability.py::generate_gradcam_png` for a heatmap given a loaded
model, an input, and a target class index. Both are exactly what
`app/backend/main.py`'s `/api/analyze` endpoint calls — there's no separate
"demo" code path with different behavior from the real API.

## Ethical considerations

- **No patient data.** This project does not collect, store, or transmit
  any information beyond the uploaded image and its analysis result — no
  names, identifiers, or metadata are requested or retained. Uploaded
  images are stored only in the browser's local IndexedDB (see the About &
  Safety page in-app for how to delete them individually or all at once).
  Users are warned not to upload images containing patient-identifying
  information.
- **Careful language.** Every surface in the UI and API describes outputs
  as "the model predicted…" / "model confidence…" — never "you have…" or
  "this confirms…" — because a statistical model's output is not a
  clinical finding, and the wording should never imply otherwise.
- **Explicit, persistent disclaimers.** The medical-device disclaimer is
  shown on every page (header banner) and in full on the About & Safety
  page, not buried in a terms-of-service document.
- **Real numbers, stated limitations.** Every metric and claim in this
  README and in the app is a real, reproducible number from
  `models/eval_metrics.json` / `models/train_log.json` — including the
  unflattering ones (52% test accuracy, overfitting past epoch 3, Mild/
  Moderate confusion). Presenting only favorable numbers from a model this
  size would itself be a form of fabrication.
- **Dataset provenance and consent boundaries respected.** Licensing was
  checked for every dataset considered before use (see
  [DATASET.md](DATASET.md)); datasets requiring credentials this project
  doesn't hold, or registration it can't complete on a user's behalf, were
  excluded rather than worked around.
