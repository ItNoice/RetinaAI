import { useTrainingLog } from "../hooks/useStatus";

const KEY_OVERRIDES: Record<string, string> = { lr: "LR" };

function formatHyperparamKey(key: string): string {
  return key
    .split("_")
    .map((w) => KEY_OVERRIDES[w] ?? w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  return `${minutes}m ${rest}s`;
}

export default function Experiments() {
  const { trainingLog, loading } = useTrainingLog();

  const maxAcc = Math.max(
    1,
    ...trainingLog.history.flatMap((e) => [e.trainAcc, e.valAcc]),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-clinic-900">
          Experiments
        </h1>
        <p className="mt-2 max-w-2xl text-clinic-600 leading-relaxed">
          The real, unedited per-epoch history of the training run that
          produced the currently loaded model — computed by{" "}
          <code className="font-mono text-xs bg-clinic-100 px-1 py-0.5 rounded">
            ml/train.py
          </code>
          . Only one run has been recorded here so far; this page is built to
          show more once additional runs are logged.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-clinic-500">Loading training history…</p>
      )}

      {!loading && !trainingLog.available && (
        <div className="rounded-lg border border-dashed border-clinic-300 bg-surface px-6 py-12 text-center">
          <p className="text-sm font-medium text-clinic-700">
            No training run has been logged yet
          </p>
          <p className="mt-1.5 text-sm text-clinic-500 max-w-lg mx-auto leading-relaxed">
            {trainingLog.note}
          </p>
        </div>
      )}

      {!loading && trainingLog.available && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg border border-clinic-200 bg-surface p-4">
              <p className="text-xs text-clinic-500">Epochs run</p>
              <p className="mt-1 text-2xl font-semibold text-clinic-900 tabular">
                {trainingLog.history.length}
              </p>
            </div>
            <div className="rounded-lg border border-clinic-200 bg-surface p-4">
              <p className="text-xs text-clinic-500">Best validation accuracy</p>
              <p className="mt-1 text-2xl font-semibold text-clinic-900 tabular">
                {trainingLog.bestValAcc !== null
                  ? `${(trainingLog.bestValAcc * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-clinic-200 bg-surface p-4">
              <p className="text-xs text-clinic-500">Total training time</p>
              <p className="mt-1 text-2xl font-semibold text-clinic-900 tabular">
                {trainingLog.totalTimeS !== null
                  ? formatDuration(trainingLog.totalTimeS)
                  : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-clinic-200 bg-surface p-4">
              <p className="text-xs text-clinic-500">Compute</p>
              <p className="mt-1 text-2xl font-semibold text-clinic-900">CPU only</p>
            </div>
          </div>

          <div className="rounded-lg border border-clinic-200 bg-surface p-5">
            <h2 className="text-sm font-semibold text-clinic-900 mb-1">
              Hyperparameters
            </h2>
            <p className="text-xs text-clinic-500 mb-3">
              Exactly as passed to <code className="font-mono">ml/train.py</code>.
            </p>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
              {Object.entries(trainingLog.hyperparameters).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-3">
                  <dt className="text-clinic-500">{formatHyperparamKey(key)}</dt>
                  <dd className="text-clinic-800 text-right truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-lg border border-clinic-200 bg-surface p-5">
            <h2 className="text-sm font-semibold text-clinic-900 mb-1">
              Per-epoch accuracy
            </h2>
            <p className="text-xs text-clinic-500 mb-4">
              Train accuracy climbing while validation accuracy plateaus or
              drops is overfitting — visible here after epoch 3, which is why
              the checkpoint saved is epoch 3's, not the final epoch's.
            </p>
            <div className="flex items-center gap-4 mb-3 text-xs text-clinic-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-accent-500" aria-hidden="true" />
                Train accuracy
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-clinic-400" aria-hidden="true" />
                Validation accuracy
              </span>
            </div>
            <div className="space-y-2">
              {trainingLog.history.map((e) => (
                <div key={e.epoch} className="flex items-center gap-3 text-sm">
                  <span className="w-14 shrink-0 text-clinic-500 tabular">
                    Epoch {e.epoch}
                  </span>
                  <div className="flex-1 space-y-1">
                    <div className="h-2 rounded-full bg-clinic-100 overflow-hidden">
                      <div
                        className="h-full bg-accent-500 rounded-full"
                        style={{ width: `${(e.trainAcc / maxAcc) * 100}%` }}
                      />
                    </div>
                    <div className="h-2 rounded-full bg-clinic-100 overflow-hidden">
                      <div
                        className="h-full bg-clinic-400 rounded-full"
                        style={{ width: `${(e.valAcc / maxAcc) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-32 shrink-0 text-right tabular text-clinic-600">
                    {(e.trainAcc * 100).toFixed(1)}% / {(e.valAcc * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-clinic-200 bg-surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <caption className="sr-only">
                  Full per-epoch training log: loss and accuracy for both the
                  training and validation sets, and wall-clock time per epoch.
                </caption>
                <thead>
                  <tr className="border-b border-clinic-200 text-left">
                    <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide">Epoch</th>
                    <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide text-right">Train loss</th>
                    <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide text-right">Train acc</th>
                    <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide text-right">Val loss</th>
                    <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide text-right">Val acc</th>
                    <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingLog.history.map((e) => (
                    <tr key={e.epoch} className="border-b border-clinic-100 last:border-0">
                      <td className="p-3 text-clinic-900 font-medium">{e.epoch}</td>
                      <td className="p-3 text-right tabular text-clinic-700">{e.trainLoss.toFixed(3)}</td>
                      <td className="p-3 text-right tabular text-clinic-700">{(e.trainAcc * 100).toFixed(1)}%</td>
                      <td className="p-3 text-right tabular text-clinic-700">{e.valLoss.toFixed(3)}</td>
                      <td className="p-3 text-right tabular text-clinic-700">{(e.valAcc * 100).toFixed(1)}%</td>
                      <td className="p-3 text-right tabular text-clinic-600">{e.epochTimeS.toFixed(0)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
