import { Link } from "react-router-dom";

export default function Ethics() {
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-clinic-900">
          Ethics
        </h1>
        <p className="mt-2 text-clinic-600 leading-relaxed">
          The principles behind how this project handles data, language, and
          uncertainty — distinct from the safety disclaimer on the{" "}
          <Link to="/about" className="text-accent-600 underline">
            About &amp; Safety
          </Link>{" "}
          page, which covers what the tool is and isn't for.
        </p>
      </div>

      <section>
        <h2 className="text-base font-semibold text-clinic-900">
          Never fabricate
        </h2>
        <p className="mt-2 text-sm text-clinic-600 leading-relaxed">
          No dataset claim, accuracy number, model result, or research
          finding in this project is invented. When something hasn't
          happened yet — no model trained, no evaluation run, no heatmap
          generated for a given image — the interface says so explicitly
          instead of showing a plausible-looking placeholder. That includes
          reporting real results even when they're unflattering: the current
          model is 52% accurate on held-out data (see{" "}
          <Link to="/research" className="text-accent-600 underline">
            Research
          </Link>
          ), and it visibly overfits after epoch 3 (see{" "}
          <Link to="/experiments" className="text-accent-600 underline">
            Experiments
          </Link>
          ). Presenting only favorable numbers would itself be a form of
          fabrication.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-clinic-900">
          Careful language
        </h2>
        <p className="mt-2 text-sm text-clinic-600 leading-relaxed">
          Results are always phrased as outputs of a statistical model, never
          as findings about a person — "the model predicted…" or "model
          confidence…," never "you have…" or "this confirms…" A Grad-CAM
          heatmap highlights regions that influenced a prediction; it is
          never described as evidence of disease.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-clinic-900">
          Dataset provenance and consent
        </h2>
        <p className="mt-2 text-sm text-clinic-600 leading-relaxed">
          Before any dataset was downloaded, its license was checked. DDR
          (CC BY 4.0) was used because it was the only one of the four
          candidate datasets that could be obtained without credentials this
          project doesn't hold or manual registration it can't complete on a
          user's behalf — EyePACS's Kaggle terms prohibit redistribution,
          APTOS 2019 requires a Kaggle account, and Messidor-2 requires
          registration through ADCIS. Full detail is in{" "}
          <code className="font-mono text-xs bg-clinic-100 px-1 py-0.5 rounded">
            DATASET.md
          </code>{" "}
          in the repository. No dataset is bundled into this repository.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-clinic-900">
          Your data
        </h2>
        <p className="mt-2 text-sm text-clinic-600 leading-relaxed">
          Uploaded images and their analyses are stored only in this
          browser's local storage — nothing is sent anywhere except to the
          local backend for the analysis itself. Delete any single analysis,
          or everything at once, from the{" "}
          <Link to="/about" className="text-accent-600 underline">
            About &amp; Safety
          </Link>{" "}
          page.
        </p>
      </section>
    </div>
  );
}
