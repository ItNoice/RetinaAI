"""DR class labels.

The Python-side source of truth, mirrored by DR_CLASSES in
app/frontend/src/lib/types.ts. Order is the ICDR severity scale and is load-
bearing — it's the index the model's output layer predicts — so appending or
reordering here means retraining, not just an edit.
"""

DR_CLASSES: list[str] = ["No DR", "Mild", "Moderate", "Severe", "Proliferative"]
