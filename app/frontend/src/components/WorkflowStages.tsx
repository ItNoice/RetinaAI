import { Icon, type IconName } from "./ui";

/**
 * The five stages an image passes through, shown as a single strip.
 *
 * Every stage here corresponds to something the pipeline genuinely does:
 * validation (lib/imageQuality.ts + the backend's validate_image_bytes),
 * preprocessing (crop to the fundus circle, resize to 224, ImageNet
 * normalize), inference (ResNet-18, 5-way softmax) and the rendered result.
 * Nothing is a decorative step.
 */
export type StageState = "pending" | "active" | "done" | "warn" | "error" | "unavailable";

export interface Stage {
  id: string;
  label: string;
  icon: IconName;
  state: StageState;
  /** Short factual detail — a real measurement or status, never filler. */
  detail?: string;
}

const STATE_STYLES: Record<StageState, { ring: string; ink: string; label: string }> = {
  pending: {
    ring: "border-clinic-200 bg-surface text-clinic-400",
    ink: "text-clinic-400",
    label: "Not started",
  },
  active: {
    ring: "border-accent-500 bg-accent-soft text-accent-soft-ink",
    ink: "text-clinic-900 font-medium",
    label: "In progress",
  },
  done: {
    ring: "border-ok-500/40 bg-ok-soft text-ok-soft-ink",
    ink: "text-clinic-800",
    label: "Complete",
  },
  warn: {
    ring: "border-warn-500/40 bg-warn-soft text-warn-soft-ink",
    ink: "text-clinic-800",
    label: "Needs attention",
  },
  error: {
    ring: "border-danger-500/40 bg-danger-soft text-danger-soft-ink",
    ink: "text-clinic-800",
    label: "Failed",
  },
  unavailable: {
    ring: "border-clinic-200 bg-clinic-50 text-clinic-400",
    ink: "text-clinic-500",
    label: "Unavailable",
  },
};

function StageIcon({ stage }: { stage: Stage }) {
  const style = STATE_STYLES[stage.state];
  // The glyph carries the state as a shape, not only as a colour: a tick for
  // complete, the stage's own icon while pending, a spinner while running.
  const glyph: IconName =
    stage.state === "done"
      ? "check"
      : stage.state === "error"
        ? "close"
        : stage.state === "warn"
          ? "alert"
          : stage.icon;

  return (
    <span
      className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${style.ring}`}
    >
      <Icon
        name={glyph}
        className={`w-3.5 h-3.5 ${stage.state === "active" ? "animate-pulse" : ""}`}
      />
    </span>
  );
}

export default function WorkflowStages({
  stages,
  className = "",
}: {
  stages: Stage[];
  className?: string;
}) {
  return (
    <ol
      className={`flex items-stretch gap-0 overflow-x-auto panel-scroll ${className}`}
      aria-label="Analysis workflow"
    >
      {stages.map((stage, i) => {
        const style = STATE_STYLES[stage.state];
        const isLast = i === stages.length - 1;
        return (
          <li key={stage.id} className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <StageIcon stage={stage} />
              <div className="min-w-0">
                <p className={`text-xs leading-tight truncate ${style.ink}`}>{stage.label}</p>
                <p className="text-[11px] leading-tight text-clinic-500 truncate metric">
                  {stage.detail ?? style.label}
                </p>
              </div>
            </div>
            {!isLast && (
              <div
                aria-hidden="true"
                className={`mx-1 hidden h-px min-w-4 flex-1 sm:block ${
                  stage.state === "done" ? "bg-ok-500/30" : "bg-clinic-200"
                }`}
              />
            )}
            {/* Screen readers get the state as words, since the visual state
                is carried by icon + colour. */}
            <span className="sr-only">{style.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
