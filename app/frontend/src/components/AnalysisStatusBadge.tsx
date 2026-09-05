import { Badge } from "./ui";
import type { AnalysisRecord } from "../lib/types";

// The three states an analysis can be in, previously written out three times.
// Check order matters: a quality problem is reported ahead of a prediction,
// since a grade from a flagged image is what most needs qualifying.
export default function AnalysisStatusBadge({
  record,
  className = "",
}: {
  record: AnalysisRecord;
  className?: string;
}) {
  if (!record.quality.passed) {
    return (
      <Badge tone="warn" dot className={className} title={record.quality.message}>
        Quality issue
      </Badge>
    );
  }
  if (record.prediction) {
    return (
      <Badge tone="ok" dot className={className}>
        Analyzed
      </Badge>
    );
  }
  return (
    <Badge
      tone="neutral"
      dot
      className={className}
      title="No trained model was loaded when this image was processed."
    >
      Model unavailable
    </Badge>
  );
}
