import type { ReactNode } from "react";
import type { Tone } from "./Badge";

/**
 * Inline message block — errors, warnings, notices.
 *
 * The redesign brief asks for errors that are "informative but not alarming",
 * so these are bordered soft-tint blocks with an icon and a heading rather
 * than saturated fills. Every tone carries its own icon, so the tone is
 * legible without relying on colour.
 */
const TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-clinic-200 bg-clinic-50 text-clinic-700",
  ok: "border-ok-500/30 bg-ok-soft text-ok-soft-ink",
  warn: "border-warn-500/30 bg-warn-soft text-warn-soft-ink",
  danger: "border-danger-500/30 bg-danger-soft text-danger-soft-ink",
  accent: "border-accent-400/40 bg-accent-soft text-accent-soft-ink",
};

const ICONS: Record<Tone, ReactNode> = {
  neutral: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  ok: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25 4.5-4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  warn: (
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.355-12.75c.865-1.5 3.031-1.5 3.896 0l7.355 12.75zM12 17.25h.007v.008H12v-.008z"
    />
  ),
  danger: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.007M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  accent: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  ),
};

export function Callout({
  children,
  tone = "neutral",
  title,
  icon = true,
  role,
  actions,
  className = "",
}: {
  children?: ReactNode;
  tone?: Tone;
  title?: ReactNode;
  icon?: boolean;
  role?: "alert" | "status" | "note";
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={role}
      className={`rounded-md border px-3.5 py-2.5 text-sm leading-relaxed ${TONE_CLASSES[tone]} ${className}`}
    >
      <div className="flex gap-2.5">
        {icon && (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
            className="w-4 h-4 shrink-0 mt-0.5"
          >
            {ICONS[tone]}
          </svg>
        )}
        <div className="min-w-0 flex-1">
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className={title ? "mt-0.5" : ""}>{children}</div>}
          {actions && <div className="mt-2.5 flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
