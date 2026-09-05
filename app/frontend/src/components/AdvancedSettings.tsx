import { useEffect, useState } from "react";
import { usePreferences } from "../hooks/usePreferences";
import { useModelStatus } from "../hooks/useStatus";
import { reloadModel } from "../lib/api";
import { getCacheInfo } from "../lib/storage";
import SettingsToggle from "./SettingsToggle";

// Read-only, not selectors: changing any of these needs a different trained
// model, and a dropdown would imply a capability that doesn't exist.
const FIXED_INFERENCE_FACTS = [
  { label: "Inference device", value: "CPU only — no GPU available in this environment" },
  { label: "Precision", value: "FP32 (default PyTorch CPU precision)" },
  { label: "Input resolution", value: "224 × 224px, fixed by the trained model" },
  { label: "Preprocessing", value: "Crop to fundus circle → resize → ImageNet normalize" },
];

export default function AdvancedSettings() {
  const [expanded, setExpanded] = useState(false);
  const { preferences, setPreference } = usePreferences();
  const { status } = useModelStatus();
  const [urlInput, setUrlInput] = useState(preferences.apiBaseUrlOverride ?? "");
  const [reloadResult, setReloadResult] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [cachedCount, setCachedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!expanded) return;
    void getCacheInfo().then((info) => setCachedCount(info.cachedCount));
  }, [expanded]);

  const handleReload = async () => {
    setReloading(true);
    setReloadResult(null);
    try {
      const status = await reloadModel();
      if (!status) {
        setReloadResult("Backend unreachable");
      } else if (status.available) {
        setReloadResult(`Reloaded — ${status.version}`);
      } else {
        // The reload worked; there's just no checkpoint on disk to pick up.
        setReloadResult("Reloaded — no checkpoint found on disk");
      }
    } finally {
      setReloading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="flex items-center gap-1.5 text-sm text-clinic-600 hover:text-clinic-900 transition-colors"
      >
        <svg
          viewBox="0 0 12 12"
          className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M4.5 3l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {expanded ? "Hide advanced settings" : "Show advanced settings"}
      </button>

      {expanded && (
        <div className="mt-4 space-y-5">
          <div className="rounded-lg bg-clinic-50 p-4">
            <p className="text-xs font-medium text-clinic-600 mb-2">
              Model: {status.architecture ?? "—"} {status.version ? `(${status.version})` : ""}
            </p>
            <dl className="space-y-1.5">
              {FIXED_INFERENCE_FACTS.map((fact) => (
                <div key={fact.label} className="flex justify-between gap-4 text-xs">
                  <dt className="text-clinic-500 shrink-0">{fact.label}</dt>
                  <dd className="text-clinic-700 text-right">{fact.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-2.5 text-[11px] text-clinic-400 leading-relaxed">
              These reflect what's actually running — they're not options,
              since changing any of them would need a different trained
              model.
            </p>
          </div>

          <div>
            <label htmlFor="api-endpoint" className="text-sm text-clinic-700">
              API endpoint override
            </label>
            <div className="mt-2 flex gap-2 max-w-md">
              <input
                id="api-endpoint"
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 rounded-md border border-clinic-200 bg-surface px-3 py-1.5 text-sm text-clinic-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
              <button
                type="button"
                onClick={() =>
                  setPreference("apiBaseUrlOverride", urlInput.trim() || null)
                }
                className="rounded-md bg-clinic-900 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
            <p className="mt-1.5 text-xs text-clinic-500">
              Point the app at a different backend instance. Leave blank to
              use the default (localhost:8000).
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <div>
              <p className="text-clinic-700">Model cache</p>
              <p className="text-xs text-clinic-500 mt-0.5">
                Cached Grad-CAM heatmaps and previews on this device.
              </p>
            </div>
            <span className="text-clinic-800 tabular shrink-0">
              {cachedCount === null ? "—" : `${cachedCount} cached`}
            </span>
          </div>
          <p className="text-xs text-clinic-500 -mt-2">
            Clear it from Settings → History &amp; Storage → "Clear cached
            images".
          </p>

          <SettingsToggle
            label="Debug logging"
            description="Logs every backend request/response to the browser console."
            checked={preferences.debugLogging}
            onChange={(v) => setPreference("debugLogging", v)}
          />

          <div>
            <button
              type="button"
              onClick={() => void handleReload()}
              disabled={reloading}
              className="rounded-md border border-clinic-200 px-3 py-1.5 text-sm text-clinic-700 hover:bg-clinic-50 disabled:opacity-50 transition-colors"
            >
              {reloading ? "Reloading…" : "Reload model from disk"}
            </button>
            <p className="mt-1.5 text-xs text-clinic-500">
              Forces the backend to re-read the checkpoint file — use this
              after running ml/train.py again without restarting the
              server.
            </p>
            {reloadResult && (
              <p role="status" className="mt-1.5 text-xs text-ok-soft-ink">
                {reloadResult}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
