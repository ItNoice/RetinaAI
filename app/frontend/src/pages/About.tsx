import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-clinic-900">
          About &amp; safety
        </h1>
      </div>

      <section className="rounded-lg border border-warn-500/40 bg-warn-soft p-5">
        <h2 className="text-sm font-semibold text-warn-soft-ink">
          Not a medical device
        </h2>
        <p className="mt-2 text-sm text-warn-soft-ink leading-relaxed">
          This project is an educational and research prototype. It is not a
          medical device and should not be used to diagnose, treat, or make
          clinical decisions about any person. Model predictions may be
          incorrect, and performance may differ across populations, cameras,
          image quality, and clinical settings.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-clinic-900">
          What this application does
        </h2>
        <p className="mt-2 text-sm text-clinic-600 leading-relaxed">
          RetinaAI lets you upload a retinal fundus photograph, view it in an
          ophthalmology-style image viewer, and — once a trained model is
          connected — see a predicted diabetic retinopathy severity class
          with a confidence score and a Grad-CAM visual explanation. The
          project is built incrementally; each phase is documented in the
          project README.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-clinic-900">
          How results are described
        </h2>
        <p className="mt-2 text-sm text-clinic-600 leading-relaxed">
          Results are always phrased as outputs of a statistical model, never
          as findings about a person. You will see language like{" "}
          <em>"the model predicted…"</em> or{" "}
          <em>"model confidence…"</em> — never{" "}
          <em>"you have…"</em> or <em>"this confirms…"</em>. A Grad-CAM
          heatmap, when available, highlights regions that influenced the
          prediction; it does not prove those regions contain disease.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-clinic-900">
          Data &amp; privacy
        </h2>
        <p className="mt-2 text-sm text-clinic-600 leading-relaxed">
          Uploaded images and analysis results are stored only in this
          browser's local IndexedDB storage by default — nothing is
          uploaded to a server beyond the local backend that performs the
          analysis itself. Do not upload images that contain patient names,
          dates of birth, medical record numbers, or other identifying
          information. You can delete any single analysis from its page or
          the dashboard, or manage what's stored — including deleting
          everything — from{" "}
          <Link to="/settings" className="text-accent-600 underline">
            Settings → Privacy / History &amp; Storage
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-clinic-900">
          Limitations
        </h2>
        <ul className="mt-2 text-sm text-clinic-600 leading-relaxed list-disc pl-5 space-y-1">
          <li>
            Predictions come from a model trained on a specific dataset and
            may not generalize to different cameras, populations, or image
            qualities.
          </li>
          <li>
            A Grad-CAM heatmap shows correlation with the model's decision,
            not a clinical finding.
          </li>
          <li>
            Reported metrics (accuracy, precision, recall, etc.) reflect
            performance on a specific evaluation dataset, not real-world
            clinical performance.
          </li>
          <li>No prediction from this tool should influence patient care.</li>
        </ul>
      </section>
    </div>
  );
}
