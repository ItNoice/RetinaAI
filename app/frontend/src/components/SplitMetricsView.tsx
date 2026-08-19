import type { SplitMetrics } from "../lib/types";
import ConfusionMatrix from "./ConfusionMatrix";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-clinic-200 bg-surface p-4">
      <p className="text-xs text-clinic-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-clinic-900 tabular">
        {value}
      </p>
    </div>
  );
}

function formatPct(value: number | null) {
  return value === null ? "—" : `${(value * 100).toFixed(1)}%`;
}

export default function SplitMetricsView({ metrics }: { metrics: SplitMetrics }) {
  const totalClassified = Object.values(metrics.classDistribution).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatTile label="Accuracy" value={formatPct(metrics.accuracy)} />
        <StatTile label="Precision (macro)" value={formatPct(metrics.precisionMacro)} />
        <StatTile label="Recall (macro)" value={formatPct(metrics.recallMacro)} />
        <StatTile label="F1 (macro)" value={formatPct(metrics.f1Macro)} />
        <StatTile label="ROC-AUC (macro)" value={formatPct(metrics.rocAucMacro)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-clinic-200 bg-surface p-5">
          <h3 className="text-sm font-semibold text-clinic-900 mb-1">
            Confusion matrix
          </h3>
          <p className="text-xs text-clinic-500 mb-3">
            Rows are the true (ground-truth) class; columns are what the
            model predicted. Color intensity is normalized per row.
          </p>
          <ConfusionMatrix
            matrix={metrics.confusionMatrix}
            classNames={metrics.classNames}
          />
        </div>

        <div className="rounded-lg border border-clinic-200 bg-surface p-5">
          <h3 className="text-sm font-semibold text-clinic-900 mb-3">
            Class distribution ({totalClassified} images)
          </h3>
          <div className="space-y-2">
            {metrics.classNames.map((cls) => {
              const count = metrics.classDistribution[cls] ?? 0;
              const pct = totalClassified > 0 ? count / totalClassified : 0;
              return (
                <div key={cls} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 text-clinic-700">{cls}</span>
                  <div className="flex-1 h-2 rounded-full bg-clinic-100 overflow-hidden">
                    <div
                      className="h-full bg-accent-500 rounded-full"
                      style={{ width: `${pct * 100}%` }}
                    />
                  </div>
                  <span className="w-20 shrink-0 text-right tabular text-clinic-600">
                    {count} ({(pct * 100).toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <dl className="flex flex-wrap gap-x-8 gap-y-2 text-xs text-clinic-500 border-t border-clinic-100 pt-4">
        <div className="flex gap-1.5">
          <dt className="font-medium text-clinic-600">Images evaluated:</dt>
          <dd className="tabular">{metrics.numImagesEvaluated}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-medium text-clinic-600">Model version:</dt>
          <dd className="tabular">{metrics.modelVersion}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="font-medium text-clinic-600">Dataset:</dt>
          <dd>{metrics.dataset}</dd>
        </div>
      </dl>
    </div>
  );
}
