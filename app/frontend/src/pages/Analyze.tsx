import { Link } from "react-router-dom";
import UploadZone from "../components/UploadZone";
import RecentAnalyses from "../components/RecentAnalyses";
import DisclaimerBanner from "../components/DisclaimerBanner";
import { Icon } from "../components/ui";

export default function Analyze() {
  return (
    <div className="h-full overflow-y-auto panel-scroll">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-clinic-200 bg-surface text-accent-600">
            <Icon name="scan" className="w-4.5 h-4.5" />
          </span>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-clinic-900">
              Analyze a fundus photograph
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-clinic-600">
              The image is validated, cropped to the fundus circle and resized exactly as the
              model's training data was, then classified into an ICDR severity grade with a
              Grad-CAM explanation.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <DisclaimerBanner />
        </div>

        <div className="mt-4">
          <UploadZone />
        </div>

        <div className="mt-10">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-semibold text-clinic-900">Recent</h2>
            <Link
              to="/history"
              className="rounded text-xs text-accent-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              View all
            </Link>
          </div>
          <RecentAnalyses limit={4} />
        </div>
      </div>
    </div>
  );
}
