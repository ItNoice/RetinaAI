import type { ReactNode } from "react";

// The one surface primitive — the card string was copy-pasted 26 times before
// this, in four variants that had drifted apart.
export type PanelPadding = "none" | "sm" | "md" | "lg";

// Literal p-5/p-4/p-3, because index.css's compact-density rules key off those
// exact class names. A custom scale here would silently break Interface density.
const PADDING: Record<PanelPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export function Panel({
  children,
  padding = "lg",
  className = "",
  as: Tag = "div",
  raised = false,
  ...rest
}: {
  children: ReactNode;
  padding?: PanelPadding;
  className?: string;
  as?: "div" | "section" | "aside" | "article";
  /** Use sparingly — flat panels separated by hairlines read as more clinical. */
  raised?: boolean;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={`rounded-lg border border-clinic-200 bg-surface ${PADDING[padding]} ${
        raised ? "shadow-sm" : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// Header plus an optional right-hand slot. Both live here so section headings
// stop drifting between mb-1, mb-3 and mb-4 as they had.
export function PanelHeader({
  title,
  eyebrow,
  description,
  actions,
  className = "",
  id,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-1">{eyebrow}</Eyebrow>}
        <h2 id={id} className="text-sm font-semibold text-clinic-900">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-xs text-clinic-500 leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="shrink-0 flex items-center gap-1.5">{actions}</div>}
    </div>
  );
}

/** Small uppercase label. One definition, so tracking and size stay put. */
export function Eyebrow({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[10px] font-semibold uppercase tracking-[0.08em] text-clinic-500 ${className}`}
    >
      {children}
    </p>
  );
}

/** Hairline divider used inside panels, matching the settings stacks. */
export function PanelDivider({ className = "" }: { className?: string }) {
  return <div className={`border-t border-clinic-100 ${className}`} />;
}

/** The muted note that closes most panels. */
export function PanelNote({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`mt-3 pt-3 border-t border-clinic-100 text-xs text-clinic-500 leading-relaxed ${className}`}
    >
      {children}
    </p>
  );
}
