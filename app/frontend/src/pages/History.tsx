import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteAnalysis, listAnalyses, updateAnalysis } from "../lib/storage";
import { DR_CLASSES, type AnalysisRecord, type DRClass } from "../lib/types";
import AnalysisThumbnail from "../components/AnalysisThumbnail";
import { useToast } from "../hooks/useToast";
import AnalysisStatusBadge from "../components/AnalysisStatusBadge";
import { formatDateTime, formatPercent } from "../lib/format";

type SortKey = "newest" | "oldest" | "confidence" | "class";
type ViewMode = "grid" | "table";

export default function History() {
  const navigate = useNavigate();
  const toast = useToast();
  const [records, setRecords] = useState<AnalysisRecord[] | null>(null);
  const [view, setView] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [classFilter, setClassFilter] = useState<DRClass | "all">("all");
  const [qualityOnly, setQualityOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const refresh = () => {
    void listAnalyses().then(setRecords);
  };

  useEffect(refresh, []);

  const visible = useMemo(() => {
    if (!records) return [];

    const query = search.trim().toLowerCase();
    const matching = records.filter((r) => {
      if (query && !(r.label ?? r.filename).toLowerCase().includes(query)) return false;
      if (classFilter !== "all" && r.prediction?.predictedClass !== classFilter) return false;
      // "Flagged only" — the checkbox reads as a filter for problems, so it
      // keeps the records that failed a check, not the ones that passed.
      if (qualityOnly && r.quality.passed) return false;
      return true;
    });

    // filter() already gave us a fresh array, so sorting in place is safe.
    return matching.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return a.createdAt - b.createdAt;
        // Unanalyzed records have no confidence and no class. -1 and U+FFFF
        // (the last code point localeCompare will order) park them at the
        // bottom of either sort instead of interleaving them with results.
        case "confidence":
          return (b.prediction?.confidence ?? -1) - (a.prediction?.confidence ?? -1);
        case "class":
          return (a.prediction?.predictedClass ?? "\uFFFF").localeCompare(
            b.prediction?.predictedClass ?? "\uFFFF",
          );
        case "newest":
        default:
          return b.createdAt - a.createdAt;
      }
    });
  }, [records, search, sortBy, classFilter, qualityOnly]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDelete = async (id: string, label: string) => {
    const confirmed = window.confirm("Delete this analysis? This cannot be undone.");
    if (!confirmed) return;
    await deleteAnalysis(id);
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    refresh();
    toast.success(`Deleted "${label}".`);
  };

  const startRename = (record: AnalysisRecord) => {
    setRenamingId(record.id);
    setRenameValue(record.label ?? record.filename);
  };

  const commitRename = async (record: AnalysisRecord) => {
    const trimmed = renameValue.trim();
    setRenamingId(null);
    if (!trimmed || trimmed === (record.label ?? record.filename)) return;
    await updateAnalysis({ ...record, label: trimmed });
    refresh();
    toast.success("Renamed.");
  };

  const compareSelected = () => {
    navigate("/compare", { state: { preselectIds: selectedIds } });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-clinic-900">
            History
          </h1>
          <p className="mt-2 max-w-2xl text-clinic-600 leading-relaxed">
            Every retinal image analyzed on this device. All data lives
            locally in this browser — nothing here has been uploaded
            anywhere else. Clear everything at once from{" "}
            <Link to="/settings" className="text-accent-600 underline">
              Settings → History &amp; Storage
            </Link>
            .
          </p>
        </div>
        {selectedIds.length >= 2 && (
          <button
            type="button"
            onClick={compareSelected}
            className="shrink-0 rounded-md bg-accent-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-accent-700 transition-colors"
          >
            Compare {selectedIds.length} selected
          </button>
        )}
      </div>

      {records === null ? (
        <p className="text-sm text-clinic-500">Loading history…</p>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-clinic-300 bg-surface px-6 py-12 text-center">
          <p className="text-sm font-medium text-clinic-700">
            No analyses yet
          </p>
          <p className="mt-1.5 text-sm text-clinic-500">
            <Link to="/analyze" className="text-accent-600 underline">
              Upload a retinal image
            </Link>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name…"
              aria-label="Search history"
              className="flex-1 min-w-[10rem] rounded-md border border-clinic-200 bg-surface px-3 py-1.5 text-sm text-clinic-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              aria-label="Sort by"
              className="rounded-md border border-clinic-200 bg-surface px-2.5 py-1.5 text-sm text-clinic-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="confidence">Highest confidence</option>
              <option value="class">Predicted class</option>
            </select>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value as DRClass | "all")}
              aria-label="Filter by predicted class"
              className="rounded-md border border-clinic-200 bg-surface px-2.5 py-1.5 text-sm text-clinic-700 focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="all">All classes</option>
              {DR_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-1.5 text-sm text-clinic-700">
              <input
                type="checkbox"
                checked={qualityOnly}
                onChange={(e) => setQualityOnly(e.target.checked)}
                className="accent-accent-500"
              />
              Quality issues only
            </label>
            <div className="flex-1" />
            <div role="group" aria-label="View" className="inline-flex items-center rounded-md bg-clinic-100 p-1 text-xs">
              {(["grid", "table"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`px-2.5 py-1 rounded capitalize transition-colors ${
                    view === v ? "bg-surface text-clinic-900 shadow-sm font-medium" : "text-clinic-600 hover:text-clinic-900"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="text-sm text-clinic-500">No analyses match these filters.</p>
          ) : view === "grid" ? (
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {visible.map((r) => (
                <li
                  key={r.id}
                  className={`group relative rounded-lg border bg-surface overflow-hidden transition-shadow hover:shadow-md ${
                    selectedIds.includes(r.id) ? "border-accent-500 ring-1 ring-accent-500" : "border-clinic-200"
                  }`}
                >
                  <label className="absolute top-2 left-2 z-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      aria-label={`Select ${r.label ?? r.filename} for comparison`}
                      className="accent-accent-500 w-4 h-4"
                    />
                  </label>
                  <Link to={`/analysis/${r.id}`} className="block">
                    <div className="aspect-square bg-chrome-900">
                      <AnalysisThumbnail id={r.id} alt={`Retinal image: ${r.filename}`} />
                    </div>
                  </Link>
                  <div className="p-3">
                    {renamingId === r.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => void commitRename(r)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void commitRename(r);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="w-full rounded border border-accent-400 px-1.5 py-0.5 text-sm text-clinic-900 focus:outline-none"
                      />
                    ) : (
                      <Link to={`/analysis/${r.id}`}>
                        <p className="text-sm font-medium text-clinic-900 truncate" title={r.label ?? r.filename}>
                          {r.label ?? r.filename}
                        </p>
                      </Link>
                    )}
                    <p className="text-xs text-clinic-500 mt-0.5">{formatDateTime(r.createdAt)}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <AnalysisStatusBadge record={r} />
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => startRename(r)}
                          aria-label={`Rename ${r.label ?? r.filename}`}
                          className="text-[11px] text-clinic-500 hover:text-clinic-800"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(r.id, r.label ?? r.filename)}
                          aria-label={`Delete analysis of ${r.label ?? r.filename}`}
                          className="text-[11px] text-clinic-500 hover:text-danger-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
                        <span className="sr-only">Select</span>
                      </th>
                      <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide">
                        Image
                      </th>
                      <th scope="col" className="p-3 font-medium text-clinic-500 text-xs uppercase tracking-wide">
                        Name
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
                    {visible.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-clinic-100 last:border-0 hover:bg-clinic-50 transition-colors"
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={() => toggleSelect(r.id)}
                            aria-label={`Select ${r.label ?? r.filename} for comparison`}
                            className="accent-accent-500"
                          />
                        </td>
                        <td className="p-3">
                          <Link
                            to={`/analysis/${r.id}`}
                            className="block w-10 h-10 rounded overflow-hidden bg-chrome-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                          >
                            <AnalysisThumbnail id={r.id} alt="" />
                          </Link>
                        </td>
                        <td className="p-3 max-w-[14rem]">
                          {renamingId === r.id ? (
                            <input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => void commitRename(r)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") void commitRename(r);
                                if (e.key === "Escape") setRenamingId(null);
                              }}
                              className="w-full rounded border border-accent-400 px-1.5 py-0.5 text-sm focus:outline-none"
                            />
                          ) : (
                            <Link
                              to={`/analysis/${r.id}`}
                              className="text-clinic-900 font-medium hover:text-accent-600 truncate block"
                              title={r.filename}
                            >
                              {r.label ?? r.filename}
                            </Link>
                          )}
                        </td>
                        <td className="p-3 text-clinic-600 whitespace-nowrap">
                          {formatDateTime(r.createdAt)}
                        </td>
                        <td className="p-3">
                          <AnalysisStatusBadge record={r} />
                        </td>
                        <td className="p-3 text-clinic-800">
                          {r.prediction?.predictedClass ?? "—"}
                        </td>
                        <td className="p-3 text-right tabular text-clinic-800">
                          {r.prediction
                            ? formatPercent(r.prediction.confidence, 1)
                            : "—"}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => startRename(r)}
                            className="text-xs text-clinic-500 hover:text-clinic-800 px-1.5 py-1"
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(r.id, r.label ?? r.filename)}
                            aria-label={`Delete analysis of ${r.label ?? r.filename}`}
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
        </>
      )}
    </div>
  );
}
