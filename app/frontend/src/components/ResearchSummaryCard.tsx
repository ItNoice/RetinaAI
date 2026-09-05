import { Link } from "react-router-dom";
import { usePreferences } from "../hooks/usePreferences";
import { useMetrics, useTrainingLog } from "../hooks/useStatus";

// A calm, real-data-only summary for the Overview page — deliberately not a
// dashboard "stat tile wall". Pulls from the same hooks Research.tsx and
// Experiments.tsx already use, so it can never show a number those pages
// disagree with, and reports "not yet run" honestly rather than a zero.
export default function ResearchSummaryCard() {
  const { preferences } = usePreferences();
  const { metrics, loading: metricsLoading } = useMetrics();
  const { trainingLog, loading: logLoading } = useTrainingLog();

  const test = metrics.test;

  return (
    <div className="rounded-lg border border-clinic-200 bg-surface p-4">
      <h3 className="text-sm font-semibold text-clinic-900 mb-3">
        Research activity
      </h3>

      {!metricsLoading && test ? (
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-clinic-500">Test accuracy</dt>
            <dd className="text-clinic-800 tabular">
              {(test.accuracy * 100).toFixed(preferences.decimalPlaces)}%
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-clinic-500">Test F1 (macro)</dt>
            <dd className="text-clinic-800 tabular">
              {(test.f1Macro * 100).toFixed(preferences.decimalPlaces)}%
            </dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-clinic-500">
          {metricsLoading ? "Loading evaluation…" : "No evaluation run yet."}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-clinic-100 text-xs text-clinic-500">
        {!logLoading && trainingLog.available ? (
          <p>
            Last training run: {trainingLog.history.length} epochs, best
            validation accuracy{" "}
            {trainingLog.bestValAcc !== null
              ? `${(trainingLog.bestValAcc * 100).toFixed(preferences.decimalPlaces)}%`
              : "—"}
            .
          </p>
        ) : (
          <p>{logLoading ? "Loading training log…" : "No training run logged yet."}</p>
        )}
        <p className="mt-2 flex gap-3">
          <Link to="/research" className="text-accent-600 hover:underline">
            Full metrics
          </Link>
          <Link to="/experiments" className="text-accent-600 hover:underline">
            Training log
          </Link>
        </p>
      </div>
    </div>
  );
}
