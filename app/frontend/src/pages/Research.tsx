const METRICS = ["Accuracy", "Precision", "Recall", "F1 score", "ROC-AUC"];

export default function Research() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-clinic-900">
          Research mode
        </h1>
        <p className="mt-2 max-w-2xl text-clinic-600 leading-relaxed">
          Model performance evaluated on a real held-out dataset, reported
          separately for training, validation, and test splits. Nothing on
          this page is fabricated — metrics only appear once an evaluation
          has actually been run.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-clinic-300 bg-white px-6 py-12 text-center">
        <p className="text-sm font-medium text-clinic-700">
          No evaluation has been run yet
        </p>
        <p className="mt-1.5 text-sm text-clinic-500 max-w-lg mx-auto leading-relaxed">
          This section will report {METRICS.join(", ")}, a confusion matrix,
          class distribution, and the number of images evaluated — computed
          by <code className="font-mono text-xs bg-clinic-100 px-1 py-0.5 rounded">ml/evaluate.py</code>{" "}
          against a real dataset (see{" "}
          <a href="/DATASET.md" className="underline">
            DATASET.md
          </a>
          ) once a model has been trained and evaluated.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {["Training", "Validation", "Test"].map((split) => (
          <div
            key={split}
            className="rounded-lg border border-clinic-200 bg-white p-5"
          >
            <h3 className="text-sm font-semibold text-clinic-900">
              {split} split
            </h3>
            <p className="mt-2 text-xs text-clinic-500 leading-relaxed">
              Not yet available.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
