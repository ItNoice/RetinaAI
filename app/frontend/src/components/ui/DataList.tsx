import type { ReactNode } from "react";

/**
 * Key/value readout.
 *
 * Three different definition-list shapes existed across the app. This is one
 * component with two layouts: `rows` (label left, value right — for narrow
 * panels) and `grid` (two columns — for wider metadata blocks).
 *
 * Values are tabular by default because almost all of them are numbers that
 * benefit from aligning, and misaligned digits in a clinical readout look
 * careless.
 */
export interface DataRow {
  label: ReactNode;
  value: ReactNode;
  /** Turns off tabular figures for prose values like a model name. */
  prose?: boolean;
  title?: string;
}

export function DataList({
  rows,
  layout = "rows",
  className = "",
}: {
  rows: DataRow[];
  layout?: "rows" | "grid";
  className?: string;
}) {
  if (layout === "grid") {
    return (
      <dl className={`grid grid-cols-2 gap-x-4 gap-y-2 text-sm ${className}`}>
        {rows.map((row, i) => (
          <div key={i} className="contents">
            <dt className="text-clinic-500 truncate" title={row.title}>
              {row.label}
            </dt>
            <dd
              className={`text-clinic-800 text-right ${row.prose ? "" : "metric"} break-words`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className={`space-y-2 text-sm ${className}`}>
      {rows.map((row, i) => (
        <div key={i} className="flex justify-between gap-3">
          <dt className="text-clinic-500 shrink-0" title={row.title}>
            {row.label}
          </dt>
          <dd className={`text-clinic-800 text-right ${row.prose ? "" : "metric"}`}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Placeholder for a value the app genuinely does not have. Never a zero, and
 *  never an invented figure — an em dash with a tooltip saying why. */
export function NotAvailable({ reason }: { reason?: string }) {
  return (
    <span className="text-clinic-400" title={reason}>
      —
    </span>
  );
}
