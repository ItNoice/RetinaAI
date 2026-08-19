import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAnalysis, listAnalyses } from "../lib/storage";
import type { AnalysisRecord } from "../lib/types";
import AnalysisThumbnail from "../components/AnalysisThumbnail";

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({ record }: { record: AnalysisRecord }) {
  if (!record.quality.passed) {
    return (
      <span className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded bg-danger-soft text-danger-soft-ink">
        Quality issue
      </span>
    );
  }
  if (record.prediction) {
    return (
      <span className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded bg-ok-soft text-ok-soft-ink">
        Analyzed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-1.5 py-0.5 rounded bg-clinic-100 text-clinic-500">
      Model unavailable
    </span>
  );
}

export default function History() {
  const [records, setRecords] = useState<AnalysisRecord[] | null>(null);

  const refresh = () => {
    void listAnalyses().then(setRecords);
  };

  useEffect(refresh, []);

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete this analysis? This cannot be undone.");
    if (!confirmed) return;
    await deleteAnalysis(id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-clinic-900">
          History
        </h1>
        <p className="mt-2 max-w-2xl text-clinic-600 leading-relaxed">
          Every retinal image analyzed on this device, in one table. All data
          lives locally in this browser — nothing here has been uploaded
          anywhere else. Delete any row individually, or clear everything at
          once from the{" "}
          <Link to="/about" className="text-accent-600 underline">
            About &amp; Safety
          </Link>{" "}
          page.
        </p>
      </div>

      {records === null ? (
        <p className="text-sm text-clinic-500">Loading history…</p>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-clinic-300 bg-surface px-6 py-12 text-center">
          <p className="text-sm font-medium text-clinic-700">
            No analyses yet
          </p>
          <p className="mt-1.5 text-sm text-clinic-500">
            <Link to="/" className="text-accent-600 underline">
              Upload a retinal image
            </Link>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-clinic-200 bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <caption className="sr-only">
                Table of every retinal image analyzed on this device, with
                its analysis status, predicted diabetic retinopathy grade,
                confidence, and the date it was analyzed.
              </caption>
              <thead>
                <tr className="border-b border-clinic-200 text-left">
                  <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide">
                    Image
                  </th>
                  <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide">
                    Filename
                  </th>
                  <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide">
                    Date analyzed
                  </th>
                  <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide">
                    Model predicted
                  </th>
                  <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide text-right">
                    Confidence
                  </th>
                  <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-clinic-100 last:border-0 hover:bg-clinic-50 transition-colors"
                  >
                    <td className="p-3">
                      <Link
                        to={`/analysis/${r.id}`}
                        className="block w-10 h-10 rounded overflow-hidden bg-chrome-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                      >
                        <AnalysisThumbnail id={r.id} alt="" />
                      </Link>
                    </td>
                    <td className="p-3 max-w-[14rem]">
                      <Link
                        to={`/analysis/${r.id}`}
                        className="text-clinic-900 font-medium hover:text-accent-600 truncate block"
                        title={r.filename}
                      >
                        {r.filename}
                      </Link>
                    </td>
                    <td className="p-3 text-clinic-600 whitespace-nowrap">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="p-3">
                      <StatusBadge record={r} />
                    </td>
                    <td className="p-3 text-clinic-800">
                      {r.prediction?.predictedClass ?? "—"}
                    </td>
                    <td className="p-3 text-right tabular text-clinic-800">
                      {r.prediction
                        ? `${(r.prediction.confidence * 100).toFixed(1)}%`
                        : "—"}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleDelete(r.id)}
                        aria-label={`Delete analysis of ${r.filename}`}
                        className="text-xs text-clinic-500 hover:text-danger-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-danger-500 rounded px-1.5 py-1"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
