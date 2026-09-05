import { Link } from "react-router-dom";
import { Callout } from "./ui";

/**
 * The full-text medical-device disclaimer.
 *
 * The app-wide header carries a persistent short form on every page; this is
 * the long form, shown where someone is about to obtain a prediction. Both
 * exist deliberately — the project's stated rule is that the disclaimer is
 * on-surface, not buried in a terms document.
 */
export default function DisclaimerBanner() {
  return (
    <Callout role="note" tone="warn" title="Research prototype — not a medical device">
      <p className="leading-relaxed">
        This tool must not be used to diagnose, treat, or make clinical decisions about any
        person. Predictions may be incorrect, and performance differs across populations,
        cameras, image quality and clinical settings.{" "}
        <Link to="/about" className="font-medium underline">
          Read the full disclaimer
        </Link>
        .
      </p>
    </Callout>
  );
}
