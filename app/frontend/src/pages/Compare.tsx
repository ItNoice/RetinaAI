import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  getCroppedPreviewBlob,
  getHeatmapBlob,
  getImageBlob,
  listAnalyses,
} from "../lib/storage";
import { DR_CLASSES, type AnalysisRecord } from "../lib/types";
import AnalysisThumbnail from "../components/AnalysisThumbnail";
import ImageViewer, { type ViewerTransform } from "../components/ImageViewer";
import { formatDate, formatPercent } from "../lib/format";

const MAX_COMPARE = 4;

interface DetailedImages {
  imageUrl: string;
  croppedPreviewUrl: string | null;
  heatmapUrl: string | null;
}

// Only runs while the detailed view is showing — the table needs thumbnails
// only, which AnalysisThumbnail loads itself.
function useDetailedImages(id: string | undefined): DetailedImages | null {
  const [images, setImages] = useState<DetailedImages | null>(null);

  useEffect(() => {
    if (!id) {
      setImages(null);
      return;
    }
    let cancelled = false;
    const objectUrls: string[] = [];
    void Promise.all([getImageBlob(id), getCroppedPreviewBlob(id), getHeatmapBlob(id)]).then(
      ([image, cropped, heatmap]) => {
        if (cancelled || !image) return;
        const imageUrl = URL.createObjectURL(image);
        objectUrls.push(imageUrl);
        const croppedPreviewUrl = cropped ? URL.createObjectURL(cropped) : null;
        if (croppedPreviewUrl) objectUrls.push(croppedPreviewUrl);
        const heatmapUrl = heatmap ? URL.createObjectURL(heatmap) : null;
        if (heatmapUrl) objectUrls.push(heatmapUrl);
        setImages({ imageUrl, croppedPreviewUrl, heatmapUrl });
      },
    );
    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [id]);

  return images;
}

export default function Compare() {
  const location = useLocation();
  const preselect = (location.state as { preselectIds?: string[] } | undefined)?.preselectIds;

  const [records, setRecords] = useState<AnalysisRecord[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>(preselect ?? []);
  const [detailedView, setDetailedView] = useState(false);
  const [transform, setTransform] = useState<ViewerTransform>({
    scale: 1,
    offset: { x: 0, y: 0 },
    rotation: 0,
  });

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
  const canShowDetailed = selected.length === 2;
  const showDetailed = canShowDetailed && detailedView;

  const imagesA = useDetailedImages(showDetailed ? selected[0]?.id : undefined);
  const imagesB = useDetailedImages(showDetailed ? selected[1]?.id : undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-clinic-900">
          Compare
        </h1>
        <p className="mt-2 max-w-2xl text-clinic-600 leading-relaxed">
          Select up to {MAX_COMPARE} analyses from this device to view their
          predictions side by side. With exactly 2 selected, switch to a
          detailed view with synchronized zoom and pan.
        </p>
      </div>

      {records === null ? (
        <p className="text-sm text-clinic-500">Loading analyses…</p>
      ) : records.length === 0 ? (
        <div className="rounded-lg border border-dashed border-clinic-300 bg-surface px-6 py-12 text-center">
          <p className="text-sm font-medium text-clinic-700">No analyses yet</p>
          <p className="mt-1.5 text-sm text-clinic-500">
            <Link to="/analyze" className="text-accent-600 underline">
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
                    <span className="truncate text-clinic-800" title={r.label ?? r.filename}>
                      {r.label ?? r.filename}
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
            <>
              {canShowDetailed && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailedView((v) => !v)}
                    aria-pressed={detailedView}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      detailedView
                        ? "bg-accent-600 text-white"
                        : "bg-clinic-100 text-clinic-700 hover:bg-clinic-200"
                    }`}
                  >
                    {detailedView ? "Table view" : "Detailed view (synced zoom)"}
                  </button>
                </div>
              )}

              {showDetailed ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {[selected[0], selected[1]].map((record, i) => {
                    const images = i === 0 ? imagesA : imagesB;
                    return (
                      <div key={record.id} className="space-y-2">
                        <p className="text-sm font-medium text-clinic-900 truncate" title={record.label ?? record.filename}>
                          {record.label ?? record.filename}
                        </p>
                        {images ? (
                          <ImageViewer
                            imageUrl={images.imageUrl}
                            croppedPreviewUrl={images.croppedPreviewUrl}
                            heatmapUrl={images.heatmapUrl}
                            altText={`Retinal fundus photograph: ${record.filename}`}
                            controlled={{ transform, onChange: setTransform }}
                          />
                        ) : (
                          <div className="h-96 rounded-lg bg-clinic-100 animate-pulse" />
                        )}
                        <p className="text-xs text-clinic-600">
                          {record.prediction?.predictedClass ?? "Model unavailable"}
                          {record.prediction &&
                            ` — ${formatPercent(record.prediction.confidence, 1)} confidence`}
                        </p>
                      </div>
                    );
                  })}
                </div>
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
                          <th scope="row" className="p-3 text-left text-xs font-medium text-clinic-500 uppercase tracking-wide align-top">
                            Heatmap
                          </th>
                          {selected.map((r) => (
                            <td key={r.id} className="p-3 align-top">
                              {r.hasExplainability ? (
                                <div className="w-24 h-24 rounded overflow-hidden bg-chrome-900">
                                  <AnalysisThumbnail id={r.id} kind="heatmap" alt={`Grad-CAM heatmap: ${r.filename}`} />
                                </div>
                              ) : (
                                <span className="text-clinic-500 text-xs">Not available</span>
                              )}
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
                                {r.label ?? r.filename}
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
                                ? formatPercent(r.prediction.confidence, 1)
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
        </>
      )}
    </div>
  );
}
