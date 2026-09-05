import { Badge } from "./ui";
import type { AnalysisRecord } from "../lib/types";

/**
 * The three states an analysis can be in, defined once.
 *
 * This logic was previously written out three times (History's table, the
 * Recent grid, and the model card) in three different badge shapes. The order
 * of the checks matters: a quality problem is reported ahead of a prediction,
 * because a grade computed from a flagged image is the thing most worth
 * qualifying.
 */
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
