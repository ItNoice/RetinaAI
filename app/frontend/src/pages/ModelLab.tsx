import { Fragment } from "react";
import { Link } from "react-router-dom";
import { useDatasetStatus, useModelStatus, useTrainingLog } from "../hooks/useStatus";

// Real, fixed facts about this specific pipeline — mirrors the language
// already used in AdvancedSettings.tsx and Methods.tsx. Not configurable:
// changing any of them would require a different trained model.
const FIXED_FACTS = [
  { label: "Framework", value: "PyTorch / torchvision" },
  { label: "Input resolution", value: "224 × 224px" },
  { label: "Classes", value: "5 (No DR, Mild, Moderate, Severe, Proliferative)" },
  { label: "Hardware", value: "CPU only — no GPU in this environment" },
];

export default function ModelLab() {
  const { status, backendReachable } = useModelStatus();
  const { status: dataset } = useDatasetStatus();
  const { trainingLog, loading: logLoading } = useTrainingLog();

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-clinic-900">
          Model Lab
        </h1>
        <p className="mt-2 text-clinic-600 leading-relaxed">
          Everything real and currently known about the model behind
          RetinaAI's predictions, in one place — architecture, training
          provenance, and version history. Nothing here is estimated; each
          field either comes from the running backend or says it's
          unavailable.
        </p>
      </div>

      <section className="rounded-lg border border-clinic-200 bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-clinic-900">
            {status.name}
          </h2>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
              status.available
                ? "bg-ok-soft text-ok-soft-ink"
                : "bg-clinic-100 text-clinic-500"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${status.available ? "bg-ok-500" : "bg-clinic-400"}`}
              aria-hidden="true"
            />
            {status.available ? "Ready" : "Unavailable"}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-y-2.5 text-sm">
          <dt className="text-clinic-500">Task</dt>
          <dd className="text-clinic-800 text-right">{status.task}</dd>
          <dt className="text-clinic-500">Architecture</dt>
          <dd className="text-clinic-800 text-right">{status.architecture ?? "—"}</dd>
          <dt className="text-clinic-500">Current version</dt>
          <dd className="text-clinic-800 text-right tabular">{status.version ?? "—"}</dd>
          <dt className="text-clinic-500">Trained on</dt>
          <dd className="text-clinic-800 text-right">{status.trainedOn ?? "—"}</dd>
          {FIXED_FACTS.map((fact) => (
            <Fragment key={fact.label}>
              <dt className="text-clinic-500">{fact.label}</dt>
              <dd className="text-clinic-800 text-right">{fact.value}</dd>
            </Fragment>
          ))}
        </dl>

        <p className="mt-3 pt-3 border-t border-clinic-100 text-xs text-clinic-500 leading-relaxed">
          {status.note}
          {!backendReachable && " Backend API is unreachable — showing the last known status."}
        </p>
      </section>

      <section className="rounded-lg border border-clinic-200 bg-surface p-5">
        <h2 className="text-sm font-semibold text-clinic-900 mb-1">Dataset</h2>
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-clinic-500">Name</dt>
          <dd className="text-clinic-800 text-right">{dataset.name ?? "Not yet integrated"}</dd>
          <dt className="text-clinic-500">License</dt>
          <dd className="text-clinic-800 text-right">{dataset.license ?? "—"}</dd>
          <dt className="text-clinic-500">Images</dt>
          <dd className="text-clinic-800 text-right tabular">{dataset.numImages ?? "—"}</dd>
        </dl>
      </section>

      <section className="rounded-lg border border-clinic-200 bg-surface p-5">
        <h2 className="text-sm font-semibold text-clinic-900 mb-1">
          Version history
        </h2>
        <p className="text-xs text-clinic-500 mb-4">
          Every version the backend has ever reported for this checkpoint —
          not a hardcoded release timeline.
        </p>
        {status.version ? (
          <ol className="space-y-2">
            <li className="flex items-center gap-3 rounded-md bg-clinic-50 px-3.5 py-2.5 text-sm">
              <span className="w-2 h-2 rounded-full bg-accent-500 shrink-0" aria-hidden="true" />
              <span className="font-medium text-clinic-900 tabular">{status.version}</span>
              <span className="text-clinic-500">— current</span>
            </li>
          </ol>
        ) : (
          <p className="text-sm text-clinic-500">No model version available.</p>
        )}
      </section>

      <section className="rounded-lg border border-clinic-200 bg-surface p-5">
        <h2 className="text-sm font-semibold text-clinic-900 mb-1">
          Training provenance
        </h2>
        {logLoading ? (
          <p className="text-sm text-clinic-500 mt-2">Loading training log…</p>
        ) : trainingLog.available ? (
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-clinic-500">Epochs run</dt>
            <dd className="text-clinic-800 text-right tabular">{trainingLog.history.length}</dd>
            <dt className="text-clinic-500">Best validation accuracy</dt>
            <dd className="text-clinic-800 text-right tabular">
              {trainingLog.bestValAcc !== null ? `${(trainingLog.bestValAcc * 100).toFixed(1)}%` : "—"}
            </dd>
          </dl>
        ) : (
          <p className="text-sm text-clinic-500 mt-2">{trainingLog.note}</p>
        )}
        <p className="mt-3 pt-3 border-t border-clinic-100 text-xs text-clinic-500">
          Full per-epoch history and hyperparameters:{" "}
          <Link to="/experiments" className="text-accent-600 underline">
            Experiments
          </Link>
          . Full accuracy/precision/recall/F1/ROC-AUC/confusion matrix:{" "}
          <Link to="/research" className="text-accent-600 underline">
            Research
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
