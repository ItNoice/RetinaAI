import { DR_CLASSES, DR_CLASS_DESCRIPTIONS, type AnalysisRecord } from "../lib/types";
import {
  DISCLAIMER,
  HEATMAP_DISCLAIMER,
  exportDisplayName,
  exportTimestamp,
} from "../lib/export";
import { formatMs, formatPercent } from "../lib/format";

// Always mounted but `hidden print:block`; index.css's print stylesheet hides
// everything else. window.print() gives a savable PDF with no PDF dependency.
export default function AnalysisReport({
  record,
  imageUrl,
  heatmapUrl,
  anonymize,
  includeImages,
}: {
  record: AnalysisRecord;
  imageUrl: string | null;
  heatmapUrl: string | null;
  anonymize: boolean;
  includeImages: boolean;
}) {
  const { prediction, quality } = record;

  return (
    <div id="print-report" className="hidden print:block p-8 text-black bg-white">
      <h1 className="text-xl font-semibold">RetinaAI — Analysis Report</h1>
      <p className="text-sm mt-1">{exportDisplayName(record, anonymize)}</p>
      <p className="text-xs text-gray-600">{exportTimestamp(record, anonymize)}</p>

      {includeImages && imageUrl && (
        <div className="mt-4 flex gap-4">
          <div>
            <p className="text-xs font-medium mb-1">Original</p>
            <img src={imageUrl} alt="Retinal fundus photograph" className="w-56 h-56 object-contain border border-gray-300" />
          </div>
          {heatmapUrl && (
            <div>
              <p className="text-xs font-medium mb-1">Grad-CAM heatmap</p>
              <img src={heatmapUrl} alt="Grad-CAM heatmap" className="w-56 h-56 object-contain border border-gray-300" />
            </div>
          )}
        </div>
      )}

      <h2 className="text-sm font-semibold mt-5">Model prediction</h2>
      {prediction ? (
        <>
          <p className="text-sm mt-1">
            {prediction.predictedClass} — {formatPercent(prediction.confidence, 1)} confidence
          </p>
          <p className="text-xs text-gray-600 mt-1 max-w-lg">
            {DR_CLASS_DESCRIPTIONS[prediction.predictedClass]}
          </p>
          <table className="mt-2 text-xs w-64">
            <tbody>
              {DR_CLASSES.map((cls) => (
                <tr key={cls}>
                  <td className="pr-3 py-0.5">{cls}</td>
                  <td className="py-0.5 tabular-nums">
                    {formatPercent(prediction.probabilities[cls] ?? 0, 1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-600 mt-2">
            Model version: {prediction.modelVersion} · Processing time:{" "}
            {formatMs(prediction.processingTimeMs)}
          </p>
        </>
      ) : (
        <p className="text-sm mt-1">No trained model was connected when this image was analyzed.</p>
      )}

      <h2 className="text-sm font-semibold mt-5">Image quality</h2>
      <p className="text-sm mt-1">
        {quality.passed ? "Passed" : (quality.message ?? "Quality issue detected")}
      </p>

      <h2 className="text-sm font-semibold mt-5">Image information</h2>
      <p className="text-xs text-gray-600 mt-1">
        {record.width} × {record.height}px
        {record.backend && ` · cropped to ${record.backend.croppedWidth} × ${record.backend.croppedHeight}px for analysis`}
      </p>

      {/* Same wording as the JSON export — a page that says something subtly
          different from the file is how a caveat gets quoted out of context. */}
      <p className="text-[10px] text-gray-500 mt-6 pt-3 border-t border-gray-300 leading-relaxed">
        {DISCLAIMER} {HEATMAP_DISCLAIMER}
      </p>
    </div>
  );
}
