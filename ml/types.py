"""DR class labels. Mirrors DR_CLASSES in app/frontend/src/lib/types.ts."""

# Order is the ICDR severity scale and is load-bearing — it's the index the
# output layer predicts, so reordering means retraining, not just an edit.
DR_CLASSES: list[str] = ["No DR", "Mild", "Moderate", "Severe", "Proliferative"]
