import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAnalyses } from "../lib/storage";
import { DR_CLASSES, type AnalysisRecord } from "../lib/types";
import AnalysisThumbnail from "../components/AnalysisThumbnail";

const MAX_COMPARE = 4;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export default function Compare() {
  const [records, setRecords] = useState<AnalysisRecord[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    void listAnalyses().then(setRecords);
  }, []);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  };

  const selected = (records ?? []).filter((r) => selectedIds.includes(r.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-clinic-900">
          Compare
        </h1>
        <p className="mt-2 max-w-2xl text-clinic-600 leading-relaxed">
          Select up to {MAX_COMPARE} analyses from this device to view their
          predictions side by side.
        </p>
      </div>

      {records === null ? (
        <p className="text-sm text-clinic-500">Loading analyses…</p>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-clinic-300 bg-surface px-6 py-12 text-center">
          <p className="text-sm font-medium text-clinic-700">No analyses yet</p>
          <p className="mt-1.5 text-sm text-clinic-500">
            <Link to="/" className="text-accent-600 underline">
              Upload a retinal image
            </Link>{" "}
            to get started.
          </p>
        </div>
      ) : (
        <>
          <fieldset className="rounded-lg border border-clinic-200 bg-surface p-4">
            <legend className="px-1 text-sm font-semibold text-clinic-900">
              Select analyses ({selectedIds.length}/{MAX_COMPARE})
            </legend>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {records.map((r) => {
                const checked = selectedIds.includes(r.id);
                const disabled = !checked && selectedIds.length >= MAX_COMPARE;
                return (
                  <label
                    key={r.id}
                    className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm cursor-pointer transition-colors ${
                      checked
                        ? "border-accent-500 bg-accent-soft"
                        : "border-clinic-200 hover:bg-clinic-50"
                    } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(r.id)}
                      className="accent-accent-500 shrink-0"
                    />
                    <span className="truncate text-clinic-800" title={r.filename}>
                      {r.filename}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {selected.length < 2 ? (
            <p className="text-sm text-clinic-500">
              Select at least 2 analyses above to compare them.
            </p>
          ) : (
            <div className="rounded-lg border border-clinic-200 bg-surface overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <caption className="sr-only">
                    Side-by-side comparison of the selected analyses' images,
                    predictions, and probability distributions.
                  </caption>
                  <tbody>
                    <tr>
                      <th scope="row" className="p-3 text-left text-xs font-medium text-clinic-500 uppercase tracking-wide align-top w-32">
                        Image
                      </th>
                      {selected.map((r) => (
                        <td key={r.id} className="p-3 align-top">
                          <Link
                            to={`/analysis/${r.id}`}
                            className="block w-24 h-24 rounded overflow-hidden bg-chrome-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
                          >
                            <AnalysisThumbnail id={r.id} alt={`Retinal image: ${r.filename}`} />
                          </Link>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-clinic-100">
                      <th scope="row" className="p-3 text-left text-xs font-medium text-clinic-500 uppercase tracking-wide">
                        Filename
                      </th>
                      {selected.map((r) => (
                        <td key={r.id} className="p-3 text-clinic-900 font-medium max-w-[10rem] truncate" title={r.filename}>
                          <Link to={`/analysis/${r.id}`} className="hover:text-accent-600">
                            {r.filename}
                          </Link>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-clinic-100">
                      <th scope="row" className="p-3 text-left text-xs font-medium text-clinic-500 uppercase tracking-wide">
                        Date
                      </th>
                      {selected.map((r) => (
                        <td key={r.id} className="p-3 text-clinic-600 whitespace-nowrap">
                          {formatDate(r.createdAt)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-clinic-100">
                      <th scope="row" className="p-3 text-left text-xs font-medium text-clinic-500 uppercase tracking-wide">
                        Quality
                      </th>
                      {selected.map((r) => (
                        <td key={r.id} className="p-3">
                          {r.quality.passed ? (
                            <span className="inline-flex text-[11px] font-medium px-1.5 py-0.5 rounded bg-ok-soft text-ok-soft-ink">
                              Passed
                            </span>
                          ) : (
                            <span className="inline-flex text-[11px] font-medium px-1.5 py-0.5 rounded bg-danger-soft text-danger-soft-ink">
                              Quality issue
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-clinic-100">
                      <th scope="row" className="p-3 text-left text-xs font-medium text-clinic-500 uppercase tracking-wide">
                        Model predicted
                      </th>
                      {selected.map((r) => (
                        <td key={r.id} className="p-3 text-clinic-900 font-medium">
                          {r.prediction?.predictedClass ?? "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-clinic-100">
                      <th scope="row" className="p-3 text-left text-xs font-medium text-clinic-500 uppercase tracking-wide">
                        Confidence
                      </th>
                      {selected.map((r) => (
                        <td key={r.id} className="p-3 tabular text-clinic-800">
                          {r.prediction
                            ? `${(r.prediction.confidence * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-clinic-100">
                      <th scope="row" className="p-3 text-left text-xs font-medium text-clinic-500 uppercase tracking-wide align-top">
                        Probabilities
                      </th>
                      {selected.map((r) => (
                        <td key={r.id} className="p-3 align-top">
                          {r.prediction ? (
                            <div className="space-y-1 min-w-[9rem]">
                              {DR_CLASSES.map((cls) => {
                                const p = r.prediction!.probabilities[cls] ?? 0;
                                return (
                                  <div key={cls} className="flex items-center gap-1.5 text-xs">
                                    <span className="w-16 shrink-0 text-clinic-600 truncate">{cls}</span>
                                    <div className="flex-1 h-1.5 rounded-full bg-clinic-100 overflow-hidden">
                                      <div
                                        className="h-full bg-accent-500 rounded-full"
                                        style={{ width: `${p * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-clinic-500 text-xs">
                              Model unavailable
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
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
