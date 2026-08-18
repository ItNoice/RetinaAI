"""Shared constants for the ML pipeline. Canonical Python-side source for DR
class labels — mirrors app/frontend/src/lib/types.ts's DR_CLASSES so the
pipeline, backend, and frontend never disagree on class order or names.
"""

DR_CLASSES: list[str] = ["No DR", "Mild", "Moderate", "Severe", "Proliferative"]
