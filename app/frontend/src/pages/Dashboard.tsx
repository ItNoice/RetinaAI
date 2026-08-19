import DisclaimerBanner from "../components/DisclaimerBanner";
import UploadZone from "../components/UploadZone";
import RecentAnalyses from "../components/RecentAnalyses";
import ModelStatusCard from "../components/ModelStatusCard";
import DatasetInfoCard from "../components/DatasetInfoCard";
import QuickLinks from "../components/QuickLinks";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-clinic-900">
          RetinaAI
        </h1>
        <p className="mt-2 max-w-2xl text-clinic-600 leading-relaxed">
          A research prototype for AI-assisted analysis of retinal fundus
          photographs, starting with diabetic retinopathy severity grading.
          Upload an image to inspect it in the viewer and — once a trained
          model is connected — see its predicted classification alongside a
          visual explanation of the regions that influenced it.
        </p>
      </div>

      <DisclaimerBanner />

      <QuickLinks />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-clinic-900 mb-3">
            Upload a retinal image
          </h2>
          <UploadZone />
        </div>
        <div className="space-y-4">
          <ModelStatusCard />
          <DatasetInfoCard />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-clinic-900 mb-3">
          Recent analyses
        </h2>
        <RecentAnalyses />
      </div>
    </div>
  );
}
