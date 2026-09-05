import { useState } from "react";
import { Icon, DataList, NotAvailable, Eyebrow, type DataRow } from "./ui";
import type { AnalysisRecord } from "../lib/types";

/**
 * Study / acquisition context, kept deliberately separate from the AI result.
 *
 * Two rules shape this panel:
 *
 * 1. Patient and acquisition fields are shown as *not recorded*, not as demo
 *    values. This app stores no patient data by design (see the Ethics page),
 *    and a plausible-looking fake MRN or laterality in a medical UI is exactly
 *    the kind of thing that gets screenshotted and mistaken for real. The rows
 *    exist so the layout is ready for a DICOM or EHR source; they carry an
 *    explicit reason instead of a value.
 * 2. Everything that *is* shown is real: the record's own id, the analysis
 *    timestamp, the file it came from, and the model build that produced the
 *    result.
 */
function formatTimestamp(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StudyInfoPanel({
  record,
  defaultOpen = true,
  className = "",
}: {
  record: AnalysisRecord;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const studyRows: DataRow[] = [
    { label: "Study ID", value: record.id.slice(0, 8), title: record.id },
    { label: "Analyzed", value: formatTimestamp(record.createdAt), prose: true },
    { label: "Source", value: "Uploaded file", prose: true },
    { label: "File", value: record.filename, prose: true, title: record.filename },
  ];

  const notRecorded: { label: string; reason: string }[] = [
    { label: "Patient ID", reason: "This application does not collect or store patient identifiers." },
    { label: "Eye (OD/OS)", reason: "Laterality is not recorded — no DICOM or EHR source is connected." },
    { label: "Acquisition date", reason: "Capture metadata is not read from the image." },
    { label: "Device", reason: "Acquisition device is not recorded." },
  ];

  return (
    <div className={`border-b border-clinic-200 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 bg-surface-raised px-4 py-2.5 text-left hover:bg-clinic-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset"
      >
        <Icon
          name="chevron-right"
          className={`w-3.5 h-3.5 text-clinic-400 transition-transform duration-150 ${
            open ? "rotate-90" : ""
          }`}
        />
        <span className="text-xs font-semibold uppercase tracking-[0.08em] text-clinic-500">
          Study information
        </span>
        {!open && (
          <span className="ml-auto text-xs text-clinic-500 truncate max-w-[10rem]">
            {record.filename}
          </span>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4" style={{ animation: "panel-in 0.15s ease-out" }}>
          <DataList rows={studyRows} />

          <div className="mt-4 pt-3 border-t border-clinic-100">
            <Eyebrow>Not recorded</Eyebrow>
            <dl className="mt-2 space-y-2 text-sm">
              {notRecorded.map((row) => (
                <div key={row.label} className="flex justify-between gap-3">
                  <dt className="text-clinic-500 shrink-0">{row.label}</dt>
                  <dd>
                    <NotAvailable reason={row.reason} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2.5 text-[11px] text-clinic-500 leading-relaxed">
              These fields are intentionally empty. This build stores no patient
              data and reads no acquisition metadata, so showing placeholder
              values here would misrepresent what it knows.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
