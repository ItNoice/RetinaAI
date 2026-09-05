import type { ReactNode } from "react";

/**
 * Status badge and status dot.
 *
 * The same three-state analysis badge was implemented three times with three
 * different shapes (History, RecentAnalyses, ModelStatusCard). This is the
 * single definition.
 *
 * Every tone pairs a colour with a label, and `dot` adds a non-colour shape
 * cue — the app's accessibility rule is that colour alone never carries
 * meaning.
 */
export type Tone = "neutral" | "ok" | "warn" | "danger" | "accent";

const TONES: Record<Tone, string> = {
  neutral: "bg-clinic-100 text-clinic-600",
  ok: "bg-ok-soft text-ok-soft-ink",
  warn: "bg-warn-soft text-warn-soft-ink",
  danger: "bg-danger-soft text-danger-soft-ink",
  accent: "bg-accent-soft text-accent-soft-ink",
};

const DOT_TONES: Record<Tone, string> = {
  neutral: "bg-clinic-400",
  ok: "bg-ok-500",
  warn: "bg-warn-500",
  danger: "bg-danger-500",
  accent: "bg-accent-500",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  icon,
  className = "",
  title,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[11px] font-medium ${TONES[tone]} ${className}`}
    >
      {dot && <StatusDot tone={tone} />}
      {icon}
      {children}
    </span>
  );
}

export function StatusDot({
  tone = "neutral",
  pulse = false,
  className = "",
}: {
  tone?: Tone;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={`relative inline-flex shrink-0 ${className}`} aria-hidden="true">
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_TONES[tone]}`} />
      {pulse && (
        <span
          className={`absolute inset-0 rounded-full ${DOT_TONES[tone]}`}
          style={{ animation: "pulse-ring 1.8s cubic-bezier(0, 0, 0.2, 1) infinite" }}
        />
      )}
    </span>
  );
}
