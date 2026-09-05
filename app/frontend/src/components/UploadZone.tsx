import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SUPPORTED_MIME_TYPES, checkImageQuality } from "../lib/imageQuality";
import { describeQualityIssue, runAnalysis } from "../lib/analyzeFlow";
import { usePreferences } from "../hooks/usePreferences";
import { useModelStatus } from "../hooks/useStatus";
import type { QualityCheck } from "../lib/types";
import WorkflowStages from "./WorkflowStages";
import type { Stage } from "./WorkflowStages";
import { Button, Callout, DataList, Icon, IndeterminateBar, Panel } from "./ui";

const FORMAT_LABELS = "JPEG, PNG, TIFF, WebP";
const MAX_SIZE_LABEL = "25 MB";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Staged {
  file: File;
  previewUrl: string;
  dimensions: { width: number; height: number } | null;
  check: QualityCheck;
}

/**
 * Load an image and get it analyzed.
 *
 * The image is staged first — preview, real dimensions and the client-side
 * validation result — rather than vanishing into a navigation the instant a
 * file is chosen. When "analyze on upload" is on (the default) the staged
 * card is still what's on screen while the request runs, so going from
 * picking a file to seeing a result is one continuous view rather than a
 * blank page.
 */
export default function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [staged, setStaged] = useState<Staged | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "reading" | "analyzing">("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const inputId = useId();
  const { preferences } = usePreferences();
  const { status, backendReachable } = useModelStatus();

  // Object URLs are per-staged-file; revoke as soon as one is replaced.
  useEffect(() => {
    if (!staged) return;
    return () => URL.revokeObjectURL(staged.previewUrl);
  }, [staged]);

  const analyze = useCallback(
    async (file: File) => {
      setPhase("analyzing");
      setError(null);
      try {
        const result = await runAnalysis(file, preferences);
        if (result.kind === "error") {
          setError(result.message);
          return;
        }
        navigate(`/analysis/${result.id}`, {
          state: result.stored ? undefined : { record: result.record, file: result.file },
        });
      } finally {
        setPhase("idle");
      }
    },
    [navigate, preferences],
  );

  const stageFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setError(null);
      setPhase("reading");
      try {
        const { check, dimensions } = await checkImageQuality(file);
        const blocking = describeQualityIssue(check);
        if (blocking) {
          setStaged(null);
          setError(blocking);
          return;
        }
        setStaged({ file, previewUrl: URL.createObjectURL(file), dimensions, check });
        if (preferences.autoAnalyzeOnUpload) {
          await analyze(file);
        }
      } finally {
        setPhase((p) => (p === "reading" ? "idle" : p));
      }
    },
    [analyze, preferences.autoAnalyzeOnUpload],
  );

  const clear = () => {
    setStaged(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const busy = phase !== "idle";

  const stages: Stage[] = [
    {
      id: "image",
      label: "Image",
      icon: "image",
      state: staged ? "done" : phase === "reading" ? "active" : "pending",
      detail: staged?.dimensions
        ? `${staged.dimensions.width} × ${staged.dimensions.height} px`
        : undefined,
    },
    {
      id: "quality",
      label: "Quality",
      icon: "check-circle",
      state: !staged ? "pending" : staged.check.passed ? "done" : "warn",
      detail: staged ? (staged.check.passed ? "Checks passed" : "Flagged") : undefined,
    },
    {
      id: "preprocess",
      label: "Preprocess",
      icon: "layers",
      state: phase === "analyzing" ? "active" : backendReachable ? "pending" : "unavailable",
      detail: backendReachable ? undefined : "Backend unreachable",
    },
    {
      id: "model",
      label: "AI analysis",
      icon: "scan",
      state: phase === "analyzing" ? "active" : status.available ? "pending" : "unavailable",
      detail: status.available ? undefined : "Model unavailable",
    },
    { id: "results", label: "Results", icon: "check", state: "pending" },
  ];

  return (
    <div className="space-y-4">
      <Panel padding="none" className="overflow-hidden">
        <div className="border-b border-clinic-100 bg-surface-raised px-4 py-2.5">
          <WorkflowStages stages={stages} />
        </div>
        {busy && <IndeterminateBar />}

        {staged ? (
          <StagedImage
            staged={staged}
            busy={busy}
            phase={phase}
            autoAnalyze={preferences.autoAnalyzeOnUpload}
            onReplace={() => inputRef.current?.click()}
            onRemove={clear}
            onAnalyze={() => void analyze(staged.file)}
          />
        ) : (
          <div
            role="button"
            tabIndex={0}
            aria-describedby={`${inputId}-help`}
            aria-label="Load a retinal fundus photograph"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              void stageFile(e.dataTransfer.files[0]);
            }}
            className={`m-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-6 py-14 text-center transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 ${
              isDragging
                ? "border-accent-500 bg-accent-soft/40"
                : "border-clinic-300 bg-clinic-50/50 hover:border-accent-400 hover:bg-clinic-50"
            }`}
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition-colors ${
                isDragging
                  ? "border-accent-500 bg-surface text-accent-600"
                  : "border-clinic-200 bg-surface text-clinic-400"
              }`}
            >
              <Icon name="upload" className="w-5 h-5" />
            </span>
            <p className="mt-4 text-sm font-medium text-clinic-800">
              Drop a fundus photograph here, or{" "}
              <span className="text-accent-600 underline">browse files</span>
            </p>
            <p id={`${inputId}-help`} className="mt-1.5 text-xs text-clinic-500">
              {FORMAT_LABELS} · up to {MAX_SIZE_LABEL} · minimum 128 × 128 px
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={SUPPORTED_MIME_TYPES.join(",")}
          className="sr-only"
          onChange={(e) => void stageFile(e.target.files?.[0])}
          aria-label="Upload retinal fundus photograph"
        />
      </Panel>

      {error && (
        <Callout tone="danger" role="alert" title="Couldn't use that file">
          {error}
        </Callout>
      )}

      {staged && !staged.check.passed && (
        <Callout tone="warn" title="Quality flagged">
          {staged.check.message ?? "This image may be unsuitable for reliable analysis."} You
          can still analyze it — the result will carry the same warning.
        </Callout>
      )}

      {!backendReachable && (
        <Callout tone="neutral" title="Backend unreachable">
          Images can still be loaded and inspected, but no prediction can be produced until
          the backend is running.
        </Callout>
      )}
    </div>
  );
}

function StagedImage({
  staged,
  busy,
  phase,
  autoAnalyze,
  onReplace,
  onRemove,
  onAnalyze,
}: {
  staged: Staged;
  busy: boolean;
  phase: "idle" | "reading" | "analyzing";
  autoAnalyze: boolean;
  onReplace: () => void;
  onRemove: () => void;
  onAnalyze: () => void;
}) {
  return (
    <div
      className="flex flex-col gap-4 p-4 sm:flex-row"
      style={{ animation: "panel-in 0.15s ease-out" }}
    >
      <div className="h-40 w-full shrink-0 overflow-hidden rounded-md bg-chrome-950 sm:w-40">
        <img
          src={staged.previewUrl}
          alt={`Preview of ${staged.file.name}`}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-clinic-900" title={staged.file.name}>
          {staged.file.name}
        </p>
        <DataList
          className="mt-2.5"
          rows={[
            {
              label: "Dimensions",
              value: staged.dimensions
                ? `${staged.dimensions.width} × ${staged.dimensions.height} px`
                : "—",
            },
            { label: "File size", value: formatBytes(staged.file.size) },
            { label: "Format", value: staged.file.type, prose: true },
            {
              label: "Status",
              value: staged.check.passed ? "Ready to analyze" : "Quality flagged",
              prose: true,
            },
          ]}
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!autoAnalyze && (
            <Button variant="primary" onClick={onAnalyze} disabled={busy}>
              {phase === "analyzing" ? "Analyzing…" : "Run analysis"}
            </Button>
          )}
          <Button onClick={onReplace} disabled={busy}>
            Replace
          </Button>
          <Button variant="ghost" onClick={onRemove} disabled={busy}>
            Remove
          </Button>
          {phase === "analyzing" && (
            <span role="status" className="text-xs text-clinic-500">
              Preprocessing and classifying…
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
