import { Link } from "react-router-dom";
import EyeAnatomyDiagram from "../components/EyeAnatomyDiagram";
import { DR_CLASSES, DR_CLASS_DESCRIPTIONS } from "../lib/types";

interface Condition {
  name: string;
  summary: string;
  screenedByThisApp: boolean;
}

const CONDITIONS: Condition[] = [
  {
    name: "Diabetic retinopathy",
    summary:
      "Damage to the retina's blood vessels caused by prolonged high blood sugar — one of the leading causes of preventable blindness in adults. Staged on the International Clinical Diabetic Retinopathy (ICDR) severity scale, from no visible disease through proliferative (sight-threatening) disease.",
    screenedByThisApp: true,
  },
  {
    name: "Glaucoma",
    summary:
      "A group of conditions that damage the optic nerve, often — though not always — associated with elevated pressure inside the eye. It's a leading cause of irreversible blindness worldwide and frequently progresses with no early symptoms, which is why regular eye exams (not symptoms) are how it's usually caught early.",
    screenedByThisApp: false,
  },
  {
    name: "Age-related macular degeneration (AMD)",
    summary:
      "Damage to the macula causing progressive loss of central vision, while peripheral vision is usually preserved. Classified as \"dry\" (gradual thinning of macular tissue) or \"wet\" (abnormal blood vessel growth under the retina) — a leading cause of vision loss in people over 50.",
    screenedByThisApp: false,
  },
  {
    name: "Cataracts",
    summary:
      "Clouding of the eye's naturally clear lens, causing blurry vision, glare sensitivity, and faded colors. Cataracts usually develop gradually with age and are treated with a well-established surgical lens-replacement procedure. Because the lens sits in front of the retina, a significant cataract can also degrade the quality of a fundus photograph itself.",
    screenedByThisApp: false,
  },
];

export default function Knowledge() {
  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-clinic-900">
          Knowledge
        </h1>
        <p className="mt-2 max-w-2xl text-clinic-600 leading-relaxed">
          General ophthalmology background — the anatomy a fundus photograph
          actually shows, and short summaries of common retinal conditions.
          This is educational reference material, not a diagnostic tool, and
          not a description of any specific uploaded image.
        </p>
      </div>

      <section>
        <h2 className="text-base font-semibold text-clinic-900 mb-4">
          Eye anatomy
        </h2>
        <EyeAnatomyDiagram />
      </section>

      <section>
        <h2 className="text-base font-semibold text-clinic-900 mb-1">
          Retinal conditions
        </h2>
        <p className="text-sm text-clinic-500 mb-4">
          General background only — none of this describes any specific
          image analyzed in this application.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CONDITIONS.map((condition) => (
            <div
              key={condition.name}
              className="rounded-lg border border-clinic-200 bg-surface p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-clinic-900">
                  {condition.name}
                </h3>
                {condition.screenedByThisApp ? (
                  <span className="shrink-0 text-[11px] font-medium px-1.5 py-0.5 rounded bg-ok-soft text-ok-soft-ink">
                    Screened here
                  </span>
                ) : (
                  <span className="shrink-0 text-[11px] font-medium px-1.5 py-0.5 rounded bg-clinic-100 text-clinic-500">
                    Not screened here
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-clinic-600 leading-relaxed">
                {condition.summary}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-clinic-900 mb-1">
          The ICDR diabetic retinopathy scale
        </h2>
        <p className="text-sm text-clinic-500 mb-4">
          The 5 severity classes this project's model is trained to
          distinguish. See{" "}
          <Link to="/methods" className="text-accent-600 underline">
            Methods
          </Link>{" "}
          for how a prediction is actually produced.
        </p>
        <ol className="space-y-2">
          {DR_CLASSES.map((cls, i) => (
            <li
              key={cls}
              className="flex gap-3 rounded-md border border-clinic-200 bg-surface px-3.5 py-2.5 text-sm"
            >
              <span className="shrink-0 w-5 h-5 rounded-full bg-clinic-100 text-clinic-600 text-xs font-medium flex items-center justify-center">
                {i}
              </span>
              <span>
                <span className="font-medium text-clinic-900">{cls}</span>
                <span className="text-clinic-600">
                  {" "}
                  — {DR_CLASS_DESCRIPTIONS[cls]}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
