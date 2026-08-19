import type { SplitMetrics } from "../lib/types";
import { usePreferences } from "../hooks/usePreferences";
import { computePerClassStats } from "../lib/perClassMetrics";
import ConfusionMatrix from "./ConfusionMatrix";

function StatTile({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        emphasized
          ? "border-accent-500 bg-accent-soft"
          : "border-clinic-200 bg-surface"
      }`}
    >
      <p className={`text-xs ${emphasized ? "text-accent-soft-ink" : "text-clinic-500"}`}>
        {label}
      </p>
      <p
        className={`mt-1 text-2xl font-semibold tabular ${
          emphasized ? "text-accent-soft-ink" : "text-clinic-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function SplitMetricsView({ metrics }: { metrics: SplitMetrics }) {
  const { preferences } = usePreferences();
  const dp = preferences.decimalPlaces;

  const formatPct = (value: number | null) =>
    value === null ? "—" : `${(value * 100).toFixed(dp)}%`;

  const totalClassified = Object.values(metrics.classDistribution).reduce(
    (a, b) => a + b,
    0,
  );

  const perClass = computePerClassStats(metrics.confusionMatrix, metrics.classNames);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatTile
          label="Accuracy"
          value={formatPct(metrics.accuracy)}
          emphasized={preferences.defaultMetric === "accuracy"}
        />
        {preferences.showAdvancedMetrics && (
          <>
            <StatTile
              label="Precision (macro)"
              value={formatPct(metrics.precisionMacro)}
              emphasized={preferences.defaultMetric === "precision"}
            />
            <StatTile
              label="Recall (macro)"
              value={formatPct(metrics.recallMacro)}
              emphasized={preferences.defaultMetric === "recall"}
            />
            <StatTile
              label="F1 (macro)"
              value={formatPct(metrics.f1Macro)}
              emphasized={preferences.defaultMetric === "f1"}
            />
            <StatTile label="ROC-AUC (macro)" value={formatPct(metrics.rocAucMacro)} />
          </>
        )}
      </div>
      {!preferences.showAdvancedMetrics && preferences.defaultMetric !== "accuracy" && (
        <p className="text-xs text-clinic-500 -mt-4">
          Your default metric ({preferences.defaultMetric}) needs "Show
          advanced metrics" turned on (Settings → Research) to display.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {preferences.showConfusionMatrix && (
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
        )}

        {preferences.showDatasetStatistics && (
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
        )}
      </div>

      {preferences.showPerClassPerformance && (
        <div className="rounded-lg border border-clinic-200 bg-surface overflow-hidden">
          <div className="p-5 pb-0">
            <h3 className="text-sm font-semibold text-clinic-900 mb-1">
              Per-class performance
            </h3>
            <p className="text-xs text-clinic-500 mb-3">
              Precision/recall/F1 computed per class from the confusion
              matrix above (not a separate evaluation run).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <caption className="sr-only">
                Precision, recall, F1, and support for each diabetic
                retinopathy severity class.
              </caption>
              <thead>
                <tr className="border-b border-clinic-200 text-left">
                  <th scope="col" className="px-5 py-2 font-medium text-clinic-500 text-xs uppercase tracking-wide">Class</th>
                  <th scope="col" className="px-3 py-2 font-medium text-clinic-500 text-xs uppercase tracking-wide text-right">Precision</th>
                  <th scope="col" className="px-3 py-2 font-medium text-clinic-500 text-xs uppercase tracking-wide text-right">Recall</th>
                  <th scope="col" className="px-3 py-2 font-medium text-clinic-500 text-xs uppercase tracking-wide text-right">F1</th>
                  <th scope="col" className="px-5 py-2 font-medium text-clinic-500 text-xs uppercase tracking-wide text-right">Support</th>
                </tr>
              </thead>
              <tbody>
                {perClass.map((c) => (
                  <tr key={c.className} className="border-b border-clinic-100 last:border-0">
                    <td className="px-5 py-2 text-clinic-900 font-medium">{c.className}</td>
                    <td className="px-3 py-2 text-right tabular text-clinic-700">{formatPct(c.precision)}</td>
                    <td className="px-3 py-2 text-right tabular text-clinic-700">{formatPct(c.recall)}</td>
                    <td className="px-3 py-2 text-right tabular text-clinic-700">{formatPct(c.f1)}</td>
                    <td className="px-5 py-2 text-right tabular text-clinic-600">{c.support}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
