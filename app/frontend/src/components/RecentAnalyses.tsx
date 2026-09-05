import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteAnalysis, listAnalyses } from "../lib/storage";
import type { AnalysisRecord } from "../lib/types";
import { usePreferences } from "../hooks/usePreferences";
import { useToast } from "../hooks/useToast";
import AnalysisThumbnail from "./AnalysisThumbnail";
import AnalysisStatusBadge from "./AnalysisStatusBadge";
import { ButtonLink, Icon, Skeleton } from "./ui";
import { formatDateTime } from "../lib/format";

export default function RecentAnalyses({ limit }: { limit?: number }) {
  const [records, setRecords] = useState<AnalysisRecord[] | null>(null);
  const { preferences } = usePreferences();
  const toast = useToast();

  const refresh = () => {
    void listAnalyses().then(setRecords);
  };

  useEffect(refresh, []);

  const handleDelete = async (id: string) => {
    await deleteAnalysis(id);
    refresh();
    toast.success("Analysis deleted.");
  };

  if (records === null) {
    // Skeletons in the shape of the cards, so the grid doesn't reflow when
    // the records arrive.
    return (
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">
        {Array.from({ length: limit ?? 4 }, (_, i) => (
          <li key={i} className="overflow-hidden rounded-lg border border-clinic-200 bg-surface">
            <Skeleton className="aspect-square rounded-none" />
            <div className="space-y-2 p-3">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-clinic-300 bg-surface px-5 py-10 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-clinic-200 bg-clinic-50 text-clinic-400">
          <Icon name="image" className="w-4.5 h-4.5" />
        </span>
        <p className="mt-3 text-sm font-medium text-clinic-800">No analyses yet</p>
        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-clinic-500">
          Load a fundus photograph to run it through the pipeline. Results are stored in this
          browser only.
        </p>
        <ButtonLink to="/analyze" variant="primary" className="mt-4">
          <Icon name="upload" className="w-4 h-4" />
          Load image
        </ButtonLink>
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
              <p className="text-xs text-clinic-500 mt-0.5">{formatDateTime(r.createdAt)}</p>
              <AnalysisStatusBadge record={r} className="mt-2" />
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
