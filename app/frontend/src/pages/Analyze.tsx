import UploadZone from "../components/UploadZone";
import DisclaimerBanner from "../components/DisclaimerBanner";

export default function Analyze() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-clinic-900">
          Analyze
        </h1>
        <p className="mt-2 text-clinic-600 leading-relaxed">
          Upload a retinal fundus photograph. It's validated and preprocessed
          identically to how the model was trained, then — if a backend is
          reachable — classified with a full probability distribution and a
          Grad-CAM explanation.
        </p>
      </div>

      <DisclaimerBanner />

      <UploadZone />
    </div>
  );
}
