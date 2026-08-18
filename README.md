# RetinaAI

An educational / research prototype for AI-assisted analysis of retinal fundus photographs.

> **Status: under active development.** This README is a placeholder that will be
> replaced with full documentation (background, methodology, results, ethics) in
> the final phase of the project. See `ml/` for the pipeline structure and
> `app/` for the web application.

## ⚠️ Not a medical device

This project is an educational and research prototype. It is **not** a medical
device and must not be used to diagnose, treat, or make clinical decisions about
any person. Model predictions may be incorrect, and performance may differ
across populations, cameras, image quality, and clinical settings.

## Project layout

```
app/            web application (frontend + backend)
ml/             training / evaluation / inference / explainability pipeline
models/         exported model weights (not committed to git)
datasets/       local dataset storage (not committed to git — see DATASET.md)
notebooks/      exploratory analysis
tests/          automated tests
DATASET.md      dataset provenance, license, and preprocessing documentation
```

Full setup, training, and usage instructions will be added as each phase of the
project lands.
