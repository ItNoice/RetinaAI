import { useRef, useState } from "react";
import { useMetrics } from "../hooks/useStatus";
import SplitMetricsView from "../components/SplitMetricsView";
import type { EvalSplit } from "../lib/types";

const SPLITS: EvalSplit[] = ["train", "valid", "test"];

const SPLIT_LABELS: Record<EvalSplit, string> = {
  train: "Train",
  valid: "Validation",
  test: "Test",
};

const SPLIT_DESCRIPTIONS: Record<EvalSplit, string> = {
  train:
    "The (capped, class-balanced) subset actually used to update the model's weights. High performance here is expected and does not indicate generalization.",
  valid:
    "Used to pick the best checkpoint during training (not used for weight updates). Some optimistic bias is expected since it influenced which epoch was selected.",
  test: "Held out completely — never used for training or checkpoint selection. The most honest measure of real-world performance here.",
};

const tabId = (split: EvalSplit) => `research-tab-${split}`;
const panelId = "research-tabpanel";

export default function Research() {
  const { metrics, loading } = useMetrics();
  const [activeSplit, setActiveSplit] = useState<EvalSplit>("test");
  const tabRefs = useRef<Partial<Record<EvalSplit, HTMLButtonElement | null>>>(
    {},
  );

  const activeMetrics = metrics[activeSplit];

  const focusAndSelect = (split: EvalSplit) => {
    setActiveSplit(split);
    tabRefs.current[split]?.focus();
  };

  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabledIndices = SPLITS.map((s, i) => (metrics[s] ? i : -1)).filter(
      (i) => i >= 0,
    );
    const currentPos = enabledIndices.indexOf(index);
    if (currentPos === -1) return;

    let nextPos: number | null = null;
    if (e.key === "ArrowRight") nextPos = (currentPos + 1) % enabledIndices.length;
    else if (e.key === "ArrowLeft")
      nextPos = (currentPos - 1 + enabledIndices.length) % enabledIndices.length;
    else if (e.key === "Home") nextPos = 0;
    else if (e.key === "End") nextPos = enabledIndices.length - 1;

    if (nextPos !== null) {
      e.preventDefault();
      focusAndSelect(SPLITS[enabledIndices[nextPos]]);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-clinic-900">
          Research mode
        </h1>
        <p className="mt-2 max-w-2xl text-clinic-600 leading-relaxed">
          Model performance evaluated on real held-out data, reported
          separately for training, validation, and test splits. Nothing on
          this page is fabricated — metrics only appear once an evaluation
          has actually been run, computed by{" "}
          <code className="font-mono text-xs bg-clinic-100 px-1 py-0.5 rounded">
            ml/evaluate.py
          </code>
          .
        </p>
      </div>

      {loading && (
        <p className="text-sm text-clinic-500">Loading evaluation results…</p>
      )}

      {!loading && !metrics.available && (
        <div className="rounded-lg border border-dashed border-clinic-300 bg-surface px-6 py-12 text-center">
          <p className="text-sm font-medium text-clinic-700">
            No evaluation has been run yet
          </p>
          <p className="mt-1.5 text-sm text-clinic-500 max-w-lg mx-auto leading-relaxed">
            {metrics.note}
          </p>
        </div>
      )}

      {!loading && metrics.available && (
        <div className="space-y-5">
          <div
            role="tablist"
            aria-label="Evaluation split"
            className="inline-flex items-center rounded-md bg-clinic-100 p-1 text-sm"
          >
            {SPLITS.map((split, index) => (
              <button
                key={split}
                ref={(el) => {
                  tabRefs.current[split] = el;
                }}
                id={tabId(split)}
                type="button"
                role="tab"
                aria-selected={activeSplit === split}
                aria-controls={panelId}
                tabIndex={activeSplit === split ? 0 : -1}
                disabled={!metrics[split]}
                onClick={() => setActiveSplit(split)}
                onKeyDown={(e) => onTabKeyDown(e, index)}
                className={`px-4 py-1.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                  activeSplit === split
                    ? "bg-surface text-clinic-900 shadow-sm font-medium"
                    : "text-clinic-600 hover:text-clinic-900"
                }`}
              >
                {SPLIT_LABELS[split]}
              </button>
            ))}
          </div>

          <div
            id={panelId}
            role="tabpanel"
            aria-labelledby={tabId(activeSplit)}
            tabIndex={0}
            className="space-y-5 focus:outline-none"
          >
            <p className="text-xs text-clinic-500 max-w-2xl leading-relaxed">
              {SPLIT_DESCRIPTIONS[activeSplit]}
            </p>

            {activeMetrics ? (
              <SplitMetricsView metrics={activeMetrics} />
            ) : (
              <p className="text-sm text-clinic-500">
                No {SPLIT_LABELS[activeSplit].toLowerCase()} metrics
                available.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
