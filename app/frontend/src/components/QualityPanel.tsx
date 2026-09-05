import { Icon, Panel, PanelHeader, Badge, Eyebrow } from "./ui";
import type { AnalysisRecord } from "../lib/types";

// Input-validity checks only — this app has no gradability model. Blur and
// illumination appear as explicit "not implemented" rows rather than guesses
// from an uncalibrated heuristic; each becomes a real value if one is added.
type CheckState = "pass" | "warn" | "fail" | "not-implemented";

interface QualityCheckRow {
  label: string;
  detail: string;
  state: CheckState;
}

const STATE_META: Record<
  CheckState,
  { icon: "check-circle" | "alert" | "close" | "info"; tone: string; label: string }
> = {
  pass: { icon: "check-circle", tone: "text-ok-soft-ink", label: "Pass" },
  warn: { icon: "alert", tone: "text-warn-soft-ink", label: "Warning" },
  fail: { icon: "close", tone: "text-danger-soft-ink", label: "Fail" },
  "not-implemented": { icon: "info", tone: "text-clinic-400", label: "Not implemented" },
};

export function buildQualityChecks(record: AnalysisRecord): QualityCheckRow[] {
  const { quality, width, height, backend, mimeType } = record;
  const tooSmall = quality.issues.includes("too-small");

  const checks: QualityCheckRow[] = [
    {
      label: "File decodes",
      detail: mimeType || "Decoded successfully",
      state:
        quality.issues.includes("not-an-image") || quality.issues.includes("corrupted")
          ? "fail"
          : "pass",
    },
    {
      label: "Minimum dimensions",
      detail: tooSmall
        ? `${width} × ${height} px — below the 128 px minimum`
        : `${width} × ${height} px (minimum 128 px)`,
      state: tooSmall ? "warn" : "pass",
    },
    {
      label: "File size",
      detail: quality.issues.includes("file-too-large")
        ? "Exceeds the 25 MB limit"
        : "Within the 25 MB limit",
      state: quality.issues.includes("file-too-large") ? "fail" : "pass",
    },
  ];

  if (backend) {
    // crop_to_fundus returns the full frame when it finds nothing, so a smaller
    // crop is real evidence a circle was located.
    const cropped =
      backend.croppedWidth < width || backend.croppedHeight < height;
    checks.push({
      label: "Fundus circle located",
      detail: cropped
        ? `Cropped to ${backend.croppedWidth} × ${backend.croppedHeight} px`
        : "No circular boundary found — the full frame was analyzed",
      state: cropped ? "pass" : "warn",
    });
  }

  checks.push(
    { label: "Focus / blur", detail: "Requires a gradability model", state: "not-implemented" },
    { label: "Illumination", detail: "Requires a gradability model", state: "not-implemented" },
    { label: "Field of view", detail: "Requires a gradability model", state: "not-implemented" },
  );

  return checks;
}

export default function QualityPanel({
  record,
  className = "",
}: {
  record: AnalysisRecord;
  className?: string;
}) {
  const checks = buildQualityChecks(record);
  const failed = checks.filter((c) => c.state === "fail").length;
  const warned = checks.filter((c) => c.state === "warn").length;
  const assessed = checks.filter((c) => c.state !== "not-implemented");

  // Worst state wins: one hard failure outranks any number of warnings.
  let verdict: { tone: "ok" | "warn" | "danger"; text: string } = {
    tone: "ok",
    text: "Suitable for analysis",
  };
  if (failed) {
    verdict = { tone: "danger", text: "Not suitable for analysis" };
  } else if (warned) {
    verdict = { tone: "warn", text: "Analyzed with caveats" };
  }

  return (
    <Panel padding="lg" className={className}>
      <PanelHeader
        title="Image quality"
        actions={
          <Badge tone={verdict.tone} dot>
            {verdict.text}
          </Badge>
        }
      />

      <p className="mt-1 text-xs text-clinic-500 leading-relaxed">
        {assessed.length} automated {assessed.length === 1 ? "check" : "checks"} ran on this
        image.{" "}
        {warned > 0 && !failed
          ? "The model still produced a prediction, but treat it with more caution than usual."
          : "These are input-validity checks, not a clinical gradability assessment."}
      </p>

      <ul className="mt-4 space-y-2.5">
        {checks.map((check) => {
          const meta = STATE_META[check.state];
          return (
            <li key={check.label} className="flex items-start gap-2.5 text-sm">
              <Icon
                name={meta.icon}
                className={`w-4 h-4 mt-0.5 ${meta.tone}`}
                title={meta.label}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={
                    check.state === "not-implemented"
                      ? "text-clinic-400"
                      : "text-clinic-800"
                  }
                >
                  {check.label}
                </p>
                <p className="text-xs text-clinic-500 leading-snug">{check.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-md border border-clinic-200 bg-clinic-50 px-3 py-2.5">
        <Eyebrow>No quality score</Eyebrow>
        <p className="mt-1 text-xs text-clinic-600 leading-relaxed">
          This build has no image-gradability model, so it does not produce a
          numeric quality score. The greyed checks above are the ones such a
          model would fill in — they are shown as unimplemented rather than
          estimated.
        </p>
      </div>
    </Panel>
  );
}
