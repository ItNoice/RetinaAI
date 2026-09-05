import { Link } from "react-router-dom";

export default function Methods() {
  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-clinic-900">
          Methods
        </h1>
        <p className="mt-2 text-clinic-600 leading-relaxed">
          How RetinaAI actually processes an image and produces a prediction
          — the real pipeline, not a simplified marketing version of it. Full
          detail lives in the project README and{" "}
          <code className="font-mono text-xs bg-clinic-100 px-1 py-0.5 rounded">
            DATASET.md
          </code>
          .
        </p>
      </div>

      <section>
        <h2 className="text-base font-semibold text-clinic-900">Pipeline</h2>
        <p className="mt-2 text-sm text-clinic-600 leading-relaxed">
          The same preprocessing code runs during training and during a live
          upload — one function, not two implementations kept in sync by
          hand.
        </p>
        <ol className="mt-3 space-y-2 text-sm text-clinic-700">
          {[
            "Image validation — format, size, corruption checks",
            "Crop to the fundus circle's bounding box, removing the black surround",
            "Resize to 224×224",
            "ImageNet mean/std normalization, matching the pretrained backbone",
            "Model inference — a 5-class probability distribution",
            "Grad-CAM — a heatmap over the same preprocessed image",
          ].map((step, i) => (
            <li key={step} className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-clinic-100 text-clinic-600 text-xs font-medium flex items-center justify-center">
                {i + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-base font-semibold text-clinic-900">
          Model architecture
        </h2>
        <p className="mt-2 text-sm text-clinic-600 leading-relaxed">
          ResNet-18, pretrained on ImageNet, with its final layer replaced by
          a fresh 5-class head. Only the last residual block (
          <code className="font-mono text-xs">layer4</code>) and that new
          head are trainable — the rest of the backbone stays frozen. This is
          a transfer-learning setup, and the specific choice of a smaller
          backbone with partial freezing is a direct consequence of one hard
          constraint: this project trains and serves on{" "}
          <strong className="font-medium text-clinic-800">CPU only</strong> —
          there is no GPU in this environment. See{" "}
          <Link to="/experiments" className="text-accent-600 underline">
            Experiments
          </Link>{" "}
          for what that training run actually looked like.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-clinic-900">
          Explainability
        </h2>
        <p className="mt-2 text-sm text-clinic-600 leading-relaxed">
          Grad-CAM (Selvaraju et al., 2017), hooked into the ResNet-18's last
          convolutional block, targeting the model's own predicted class. The
          heatmap's coordinates only make sense relative to the cropped,
          resized image the model actually analyzed — the viewer shows it
          composited on that image, not the raw upload, since those two
          frames don't line up.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-clinic-900">
          Evaluation
        </h2>
        <p className="mt-2 text-sm text-clinic-600 leading-relaxed">
          Accuracy, macro precision/recall/F1, macro ROC-AUC, and a confusion
          matrix — computed with scikit-learn on real predictions from the
          loaded checkpoint. Training and validation metrics use the same
          (capped) subset actually used for training; test metrics use the
          full, uncapped, held-out test split the model never saw. See the{" "}
          <Link to="/research" className="text-accent-600 underline">
            Research
          </Link>{" "}
          page for the current real numbers.
        </p>
      </section>
    </div>
  );
}
