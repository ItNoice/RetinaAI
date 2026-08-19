import { Link } from "react-router-dom";
import DisclaimerBanner from "../components/DisclaimerBanner";
import RecentAnalyses from "../components/RecentAnalyses";
import ModelStatusCard from "../components/ModelStatusCard";
import DatasetInfoCard from "../components/DatasetInfoCard";
import ResearchSummaryCard from "../components/ResearchSummaryCard";
import { usePreferences } from "../hooks/usePreferences";

export default function Dashboard() {
  const { preferences } = usePreferences();

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-clinic-900">
          Overview
        </h1>
        <p className="mt-2 max-w-2xl text-clinic-600 leading-relaxed">
          A research prototype for AI-assisted analysis of retinal fundus
          photographs, starting with diabetic retinopathy severity grading.
        </p>
      </div>

      <DisclaimerBanner />

      <div className="rounded-xl border border-clinic-200 bg-surface px-6 py-7 sm:px-8 sm:py-8 flex items-center justify-between gap-6 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-clinic-900">
            Analyze a retinal image
          </h2>
          <p className="mt-1.5 text-sm text-clinic-600 max-w-md leading-relaxed">
            Upload a fundus photograph to inspect it in the viewer and — once
            a trained model is connected — see its predicted classification
            with a Grad-CAM explanation.
          </p>
        </div>
        <Link
          to="/analyze"
          className="shrink-0 inline-flex items-center gap-2 rounded-md bg-accent-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 transition-colors"
        >
          Analyze image
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 10h12m0 0l-5-5m5 5l-5 5" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ModelStatusCard />
        <DatasetInfoCard />
        {preferences.researchMode && <ResearchSummaryCard />}
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-sm font-semibold text-clinic-900">
            Recent analyses
          </h2>
          <Link to="/history" className="text-xs text-accent-600 hover:underline">
            View all in History
          </Link>
        </div>
        <RecentAnalyses limit={8} />
      </div>
    </div>
  );
}
