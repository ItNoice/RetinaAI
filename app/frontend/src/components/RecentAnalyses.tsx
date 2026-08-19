import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAnalysis, listAnalyses } from "../lib/storage";
import type { AnalysisRecord } from "../lib/types";
import { usePreferences } from "../hooks/usePreferences";
import AnalysisThumbnail from "./AnalysisThumbnail";

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function RecentAnalyses({ limit }: { limit?: number }) {
  const [records, setRecords] = useState<AnalysisRecord[] | null>(null);
  const { preferences } = usePreferences();

  const refresh = () => {
    void listAnalyses().then(setRecords);
  };

  useEffect(refresh, []);

  const handleDelete = async (id: string) => {
    await deleteAnalysis(id);
    refresh();
  };

  if (records === null) {
    return <p className="text-sm text-clinic-500">Loading recent analyses…</p>;
  }

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-clinic-300 bg-surface px-5 py-8 text-center">
        <p className="text-sm text-clinic-500">
          No analyses yet. Upload a retinal image to get started.
        </p>
      </div>
    );
  }

  const visible = limit ? records.slice(0, limit) : records;

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {visible.map((r) => (
        <li
          key={r.id}
          className="group relative rounded-lg border border-clinic-200 bg-surface overflow-hidden hover:shadow-md transition-shadow"
        >
          <Link to={`/analysis/${r.id}`} className="block">
            <div className="aspect-square bg-chrome-900">
              <AnalysisThumbnail id={r.id} alt={`Retinal image: ${r.filename}`} />
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-clinic-900 truncate" title={r.filename}>
                {r.filename}
              </p>
              <p className="text-xs text-clinic-500 mt-0.5">{formatDate(r.createdAt)}</p>
              <span
                className={`mt-2 inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded ${
                  !r.quality.passed
                    ? "bg-danger-soft text-danger-soft-ink"
                    : r.prediction
                      ? "bg-ok-soft text-ok-soft-ink"
                      : "bg-clinic-100 text-clinic-500"
                }`}
              >
                {!r.quality.passed
                  ? "Quality issue"
                  : r.prediction
                    ? "Analyzed"
                    : "Model unavailable"}
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              void handleDelete(r.id);
            }}
            aria-label={`Delete analysis of ${r.filename}`}
            className={`absolute top-2 right-2 h-7 rounded-full bg-chrome-900/70 text-white flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-opacity ${
              preferences.alwaysShowIconLabels ? "px-2.5" : "w-7"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {preferences.alwaysShowIconLabels && (
              <span className="text-xs">Delete</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}
