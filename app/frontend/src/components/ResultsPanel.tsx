import { usePreferences } from "../hooks/usePreferences";
import {
  DR_CLASSES,
  DR_CLASS_DESCRIPTIONS,
  type AnalysisRecord,
  type PredictionResult,
} from "../lib/types";
import type { Preferences } from "../lib/preferences";
import { Badge, Callout, DataList, Eyebrow, Icon, Panel, PanelHeader, NotAvailable } from "./ui";
import type { DataRow } from "./ui";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPct(value: number, decimalPlaces: number): string {
  return `${(value * 100).toFixed(decimalPlaces)}%`;
}

function formatMs(ms: number): string {
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(1)} ms`;
}

/**
 * Confidence, described in words as well as a number.
 *
 * These bands describe the *model's own softmax output*, not diagnostic
 * certainty, and the wording is chosen to keep that distinction: "the model
 * was decisive" says something about the model, "this is definitely severe"
 * would say something about an eye. There is no clinical validation behind
 * the cut-points, so they are framed as a reading aid and never as a
 * threshold for action.
 */
function describeConfidence(confidence: number): { label: string; tone: "ok" | "warn" | "neutral" } {
  if (confidence >= 0.85) return { label: "Decisive", tone: "ok" };
  if (confidence >= 0.6) return { label: "Moderate", tone: "neutral" };
  return { label: "Low — classes are close", tone: "warn" };
}

export default function ResultsPanel({ record }: { record: AnalysisRecord }) {
  const { preferences } = usePreferences();
  const { quality, prediction } = record;

  const showMetadataCard =
    preferences.showImageInfo || preferences.showModelInfo || preferences.showProcessingTime;

  return (
    <div className="space-y-4">
      {preferences.showQualityAssessment && !quality.passed && (
        <Callout tone="warn" role="alert" title="Image quality flagged">
          {quality.message ??
            "Image quality may be insufficient for reliable model analysis."}
        </Callout>
      )}

      {prediction ? (
        <PredictionCard prediction={prediction} preferences={preferences} />
      ) : (
        <ModelUnavailableCard />
      )}

      {showMetadataCard && <SupportingDataCard record={record} preferences={preferences} />}

      <MeasurementsCard />
    </div>
  );
}

/** The headline result. Everything above the fold in the analysis panel. */
function PredictionCard({
  prediction,
  preferences,
}: {
  prediction: PredictionResult;
  preferences: Preferences;
}) {
  const confidence = describeConfidence(prediction.confidence);
  const belowThreshold =
    preferences.minConfidenceWarning !== null &&
    prediction.confidence < preferences.minConfidenceWarning;

  // Ranked, so the runner-up is visible without reading the whole list — the
  // gap between first and second is the most useful thing on this panel.
  const ranked = DR_CLASSES.map((cls) => ({
    cls,
    p: prediction.probabilities[cls] ?? 0,
  })).sort((a, b) => b.p - a.p);
  const runnerUp = ranked[1];

  return (
    <Panel padding="none" className="overflow-hidden">
      <div className="px-5 pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <Eyebrow>Model predicted</Eyebrow>
          <Badge tone="accent">Diabetic retinopathy</Badge>
        </div>

        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="text-[26px] leading-none font-semibold tracking-tight text-clinic-900">
            {prediction.predictedClass}
          </p>
          {preferences.showConfidenceScores && (
            <div className="text-right shrink-0">
              <p className="text-xl leading-none font-semibold text-clinic-900 metric">
                {formatPct(prediction.confidence, preferences.decimalPlaces)}
              </p>
              <p className="mt-1 text-[11px] text-clinic-500">confidence</p>
            </div>
          )}
        </div>

        {preferences.showConfidenceScores && (
          <div className="mt-3 flex items-center gap-2">
            <ConfidenceMeter value={prediction.confidence} />
            <Badge tone={confidence.tone}>{confidence.label}</Badge>
          </div>
        )}

        {runnerUp && preferences.showConfidenceScores && (
          <p className="mt-2 text-xs text-clinic-500">
            Next most likely: {runnerUp.cls} at{" "}
            <span className="metric">
              {formatPct(runnerUp.p, preferences.decimalPlaces)}
            </span>
          </p>
        )}
      </div>

      {belowThreshold && (
        <div className="px-5 pb-4">
          <Callout tone="warn" role="alert">
            Confidence is below your{" "}
            <span className="metric">
              {formatPct(preferences.minConfidenceWarning ?? 0, 0)}
            </span>{" "}
            warning threshold. Treat this classification as unreliable.
          </Callout>
        </div>
      )}

      {preferences.showProbabilityDistribution && (
        <div className="border-t border-clinic-100 px-5 py-4">
          <Eyebrow className="mb-2.5">Probability distribution</Eyebrow>
          <ul className="space-y-1.5">
            {DR_CLASSES.map((cls) => {
              const p = prediction.probabilities[cls] ?? 0;
              const isPredicted = cls === prediction.predictedClass;
              return (
                <li key={cls} className="flex items-center gap-3 text-sm">
                  <span
                    className={`w-24 shrink-0 truncate ${
                      isPredicted ? "font-medium text-clinic-900" : "text-clinic-600"
                    }`}
                  >
                    {cls}
                  </span>
                  <span className="flex-1 h-1.5 rounded-full bg-clinic-100 overflow-hidden">
                    <span
                      className={`block h-full rounded-full transition-[width] duration-300 ease-out ${
                        isPredicted ? "bg-accent-500" : "bg-clinic-300"
                      }`}
                      style={{ width: `${p * 100}%` }}
                    />
                  </span>
                  <span
                    className={`w-14 shrink-0 text-right metric text-xs ${
                      isPredicted ? "text-clinic-900 font-medium" : "text-clinic-500"
                    }`}
                  >
                    {formatPct(p, preferences.decimalPlaces)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="border-t border-clinic-100 bg-clinic-50 px-5 py-4">
        <Eyebrow className="mb-1.5">About the {prediction.predictedClass} grade</Eyebrow>
        <p className="text-xs text-clinic-600 leading-relaxed">
          {DR_CLASS_DESCRIPTIONS[prediction.predictedClass]}
        </p>
        <p className="mt-3 flex gap-2 text-xs text-clinic-500 leading-relaxed">
          <Icon name="info" className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            The model classified this image as{" "}
            <span className="font-medium text-clinic-700">{prediction.predictedClass}</span>. The
            description above is general educational information about that ICDR stage — not a
            finding about this specific image. This is not a diagnosis.
          </span>
        </p>
      </div>
    </Panel>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  // Segmented rather than continuous: five ticks read as an instrument
  // readout and make it harder to over-interpret a single pixel of bar.
  const segments = 5;
  const filled = Math.round(value * segments);
  return (
    <span
      className="flex flex-1 items-center gap-1"
      role="img"
      aria-label={`Model confidence ${Math.round(value * 100)} percent`}
    >
      {Array.from({ length: segments }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
            i < filled ? "bg-accent-500" : "bg-clinic-100"
          }`}
        />
      ))}
    </span>
  );
}

function ModelUnavailableCard() {
  return (
    <Panel padding="lg">
      <PanelHeader title="Analysis result" />
      <div className="mt-4 rounded-md border border-clinic-200 bg-clinic-50 px-4 py-6 text-center">
        <Icon name="scan" className="mx-auto w-6 h-6 text-clinic-400" />
        <p className="mt-2 text-sm font-medium text-clinic-700">Model unavailable</p>
        <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-clinic-500">
          No trained checkpoint was loaded when this image was processed, so no
          prediction has been produced or fabricated.
        </p>
      </div>
    </Panel>
  );
}

/** Image geometry, model build and timings — real, but secondary. */
function SupportingDataCard({
  record,
  preferences,
}: {
  record: AnalysisRecord;
  preferences: Preferences;
}) {
  const rows: DataRow[] = [];

  if (preferences.showImageInfo) {
    rows.push(
      { label: "Resolution", value: `${record.width} × ${record.height} px` },
      { label: "File size", value: formatBytes(record.fileSizeBytes) },
      { label: "Format", value: record.mimeType, prose: true },
    );
    if (record.backend) {
      rows.push({
        label: "Analyzed region",
        value: `${record.backend.croppedWidth} × ${record.backend.croppedHeight} px`,
        title: "The fundus bounding box the model was given, after cropping",
      });
    }
  }
  if (preferences.showModelInfo && record.prediction) {
    rows.push({ label: "Model build", value: record.prediction.modelVersion, prose: true });
  }
  if (preferences.showProcessingTime) {
    if (record.prediction) {
      rows.push({ label: "Inference", value: formatMs(record.prediction.processingTimeMs) });
    }
    if (record.backend) {
      rows.push({
        label: "Preprocessing",
        value: formatMs(record.backend.preprocessingTimeMs),
      });
    }
  }

  if (rows.length === 0) return null;

  return (
    <Panel padding="lg">
      <PanelHeader title="Acquisition & processing" />
      <DataList rows={rows} className="mt-3" />
    </Panel>
  );
}

/**
 * Measurements — a deliberate shell.
 *
 * The backend computes no anatomical measurements: no vessel calibre, no
 * cup-to-disc ratio, no lesion counts, no reference ranges. Rather than
 * inventing plausible numbers or hiding the capability gap, the section states
 * what the pipeline does and does not produce. When a measurement model is
 * added, its values drop into this table unchanged.
 */
function MeasurementsCard() {
  const planned = [
    "Cup-to-disc ratio",
    "Vessel calibre (CRAE / CRVE)",
    "Lesion counts (microaneurysms, haemorrhages, exudates)",
  ];
  return (
    <Panel padding="lg">
      <PanelHeader
        title="Measurements"
        actions={<Badge tone="neutral">Not computed</Badge>}
      />
      <p className="mt-2 text-xs text-clinic-500 leading-relaxed">
        This pipeline produces a single whole-image severity classification. It
        does not segment structures or measure them, so no measurements are
        reported here.
      </p>
      <dl className="mt-3 space-y-2 text-sm">
        {planned.map((name) => (
          <div key={name} className="flex justify-between gap-3">
            <dt className="text-clinic-500">{name}</dt>
            <dd>
              <NotAvailable reason="No model in this build computes this value." />
            </dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
