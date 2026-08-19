import { DR_CLASSES, DR_CLASS_DESCRIPTIONS } from "../lib/types";
import type { AnalysisRecord } from "../lib/types";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ResultsPanel({ record }: { record: AnalysisRecord }) {
  const { quality, prediction } = record;

  return (
    <div className="space-y-5">
      {!quality.passed && (
        <div
          role="alert"
          className="rounded-md border border-danger-500/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger-soft-ink"
        >
          {quality.message ??
            "Image quality may be insufficient for reliable model analysis."}
        </div>
      )}

      <div className="rounded-lg border border-clinic-200 bg-surface p-5">
        <h2 className="text-sm font-semibold text-clinic-900 mb-4">
          Analysis result
        </h2>

        {prediction ? (
          <PredictionDetails prediction={prediction} />
        ) : (
          <div className="rounded-md bg-clinic-50 border border-clinic-200 px-4 py-6 text-center">
            <p className="text-sm font-medium text-clinic-700">
              Model unavailable
            </p>
            <p className="mt-1 text-xs text-clinic-500 max-w-xs mx-auto leading-relaxed">
              No trained diabetic retinopathy model is connected in this
              build yet. This image has been stored and can be reviewed in
              the viewer; no prediction has been produced or fabricated.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-clinic-200 bg-surface p-5">
        <h2 className="text-sm font-semibold text-clinic-900 mb-3">
          Image metadata
        </h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-clinic-500">Resolution</dt>
          <dd className="text-clinic-800 tabular text-right">
            {record.width} × {record.height}px
          </dd>
          <dt className="text-clinic-500">File size</dt>
          <dd className="text-clinic-800 tabular text-right">
            {formatBytes(record.fileSizeBytes)}
          </dd>
          <dt className="text-clinic-500">Format</dt>
          <dd className="text-clinic-800 text-right">{record.mimeType}</dd>
          <dt className="text-clinic-500">Model version</dt>
          <dd className="text-clinic-800 text-right">
            {prediction?.modelVersion ?? "—"}
          </dd>
          <dt className="text-clinic-500">Processing time</dt>
          <dd className="text-clinic-800 tabular text-right">
            {prediction ? `${prediction.processingTimeMs} ms` : "—"}
          </dd>
          {record.backend && (
            <>
              <dt className="text-clinic-500">Preprocessing time</dt>
              <dd className="text-clinic-800 tabular text-right">
                {record.backend.preprocessingTimeMs} ms
              </dd>
              <dt className="text-clinic-500">Cropped size</dt>
              <dd className="text-clinic-800 tabular text-right">
                {record.backend.croppedWidth} × {record.backend.croppedHeight}
                px
              </dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
}

function PredictionDetails({
  prediction,
}: {
  prediction: NonNullable<AnalysisRecord["prediction"]>;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-clinic-500">
            Model predicted
          </p>
          <p className="text-lg font-semibold text-clinic-900">
            {prediction.predictedClass}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-clinic-500">
            Confidence
          </p>
          <p className="text-lg font-semibold text-accent-soft-ink tabular">
            {(prediction.confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-clinic-50 px-3.5 py-2.5">
        <p className="text-xs text-clinic-600 leading-relaxed">
          <strong className="font-medium text-clinic-700">
            About the {prediction.predictedClass} grade:
          </strong>{" "}
          {DR_CLASS_DESCRIPTIONS[prediction.predictedClass]}
        </p>
      </div>

      <div className="mt-5 space-y-2">
        <p className="text-xs uppercase tracking-wide text-clinic-500">
          Probability distribution
        </p>
        {DR_CLASSES.map((cls) => {
          const p = prediction.probabilities[cls] ?? 0;
          return (
            <div key={cls} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-clinic-700">{cls}</span>
              <div className="flex-1 h-2 rounded-full bg-clinic-100 overflow-hidden">
                <div
                  className="h-full bg-accent-500 rounded-full"
                  style={{ width: `${p * 100}%` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right tabular text-clinic-600">
                {(p * 100).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-clinic-500 leading-relaxed border-t border-clinic-100 pt-3">
        The model classified this image as{" "}
        <strong className="text-clinic-700">{prediction.predictedClass}</strong>.
        The grade description above is general educational information about
        that ICDR stage — not a finding about this specific image. This is
        not a diagnosis.
      </p>
    </div>
  );
}
