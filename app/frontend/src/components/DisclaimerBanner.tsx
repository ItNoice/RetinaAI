import { Link } from "react-router-dom";
import { Callout } from "./ui";

// The long form, shown where someone is about to get a prediction. The header
// carries a short form everywhere else — on-surface, not buried in a terms page.
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
