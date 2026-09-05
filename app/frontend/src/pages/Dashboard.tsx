import { Link } from "react-router-dom";
import RecentAnalyses from "../components/RecentAnalyses";
import ModelStatusCard from "../components/ModelStatusCard";
import DatasetInfoCard from "../components/DatasetInfoCard";
import ResearchSummaryCard from "../components/ResearchSummaryCard";
import { usePreferences } from "../hooks/usePreferences";
import { useModelStatus } from "../hooks/useStatus";
import { ButtonLink, Callout, Eyebrow, Icon, Panel, StatusDot } from "../components/ui";
import type { IconName } from "../components/ui";

/**
 * The pipeline, stated once. These are the five things that actually happen
 * to an image — the same stages the workflow strip reports on during a real
 * analysis, described here so the workflow is understandable before anyone
 * uploads anything.
 */
const PIPELINE: { icon: IconName; label: string; detail: string }[] = [
  { icon: "image", label: "Image", detail: "JPEG, PNG, TIFF or WebP fundus photograph" },
  { icon: "check-circle", label: "Quality check", detail: "Format, size and dimension validation" },
  { icon: "layers", label: "Preprocess", detail: "Crop to the fundus circle, resize to 224²" },
  { icon: "scan", label: "AI analysis", detail: "ResNet-18, five-class ICDR severity" },
  { icon: "check", label: "Results", detail: "Grade, probabilities and Grad-CAM" },
];

export default function Dashboard() {
  const { preferences } = usePreferences();
  const { status, backendReachable } = useModelStatus();
  const ready = backendReachable && status.available;

  return (
    <div className="h-full overflow-y-auto panel-scroll">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Primary action. The only full-width element on the page, and the
            only accent-filled control — nothing else competes with it. */}
        <Panel padding="none" className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-5 p-5">
            <div className="min-w-0">
              <Eyebrow>Workstation</Eyebrow>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-clinic-900">
                Analyze a retinal image
              </h1>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-clinic-600">
                Load a fundus photograph to inspect it in the viewer and classify it for
                diabetic retinopathy severity, with a Grad-CAM explanation of what the model
                attended to.
              </p>
            </div>
            <ButtonLink to="/analyze" variant="primary" size="md" className="shrink-0">
              <Icon name="upload" className="w-4 h-4" />
              Load image
            </ButtonLink>
          </div>

          <ol className="grid grid-cols-1 gap-px border-t border-clinic-100 bg-clinic-100 sm:grid-cols-3 lg:grid-cols-5">
            {PIPELINE.map((step, i) => (
              <li key={step.label} className="bg-surface px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-clinic-200 text-[10px] font-semibold text-clinic-500 metric">
                    {i + 1}
                  </span>
                  <Icon name={step.icon} className="w-4 h-4 text-clinic-400" />
                  <p className="truncate text-xs font-medium text-clinic-800">{step.label}</p>
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-clinic-500">{step.detail}</p>
              </li>
            ))}
          </ol>
        </Panel>

        {!ready && (
          <Callout
            tone="warn"
            className="mt-4"
            title={backendReachable ? "No model loaded" : "Backend unreachable"}
          >
            {backendReachable
              ? "Images can be loaded, validated and viewed, but no prediction will be produced until a trained checkpoint is available."
              : "Start the backend to enable classification. Loading and inspecting images works without it."}
          </Callout>
        )}

        {/* Status row. Secondary by construction: smaller type, no accent
            fills, and below the primary action. */}
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ModelStatusCard />
          <DatasetInfoCard />
          {preferences.researchMode && <ResearchSummaryCard />}
        </div>

        <div className="mt-8">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold text-clinic-900">Recent analyses</h2>
            <Link
              to="/history"
              className="rounded text-xs text-accent-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              View all in History
            </Link>
          </div>
          <RecentAnalyses limit={8} />
        </div>

        <footer className="mt-10 flex flex-col gap-2 border-t border-clinic-200 pt-5 text-xs text-clinic-500 sm:flex-row sm:justify-between">
          <span>RetinaAI — educational &amp; research prototype.</span>
          <div className="flex items-center gap-4">
            <span>All analysis data stays on this device.</span>
            {preferences.showLocalProcessingIndicator && (
              <span className="inline-flex items-center gap-1.5">
                <StatusDot tone={backendReachable ? "ok" : "neutral"} />
                {backendReachable
                  ? "Processing locally (backend on this device)"
                  : "Backend unreachable"}
              </span>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
