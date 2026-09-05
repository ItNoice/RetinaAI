import { Icon, type IconName } from "./ui";

// Every stage maps to something the pipeline genuinely does — none is decorative.
export type StageState = "pending" | "active" | "done" | "warn" | "error" | "unavailable";

export interface Stage {
  id: string;
  label: string;
  icon: IconName;
  state: StageState;
  /** A real measurement or status, never filler. */
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

const STATE_GLYPHS: Partial<Record<StageState, IconName>> = {
  done: "check",
  error: "close",
  warn: "alert",
};

function StageIcon({ stage }: { stage: Stage }) {
  const style = STATE_STYLES[stage.state];
  // Shape as well as colour, which alone fails for red/green deficiency.
  // Unresolved stages keep their own icon.
  const glyph: IconName = STATE_GLYPHS[stage.state] ?? stage.icon;

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
            {/* The state as words, since visually it's icon + colour. */}
            <span className="sr-only">{style.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
