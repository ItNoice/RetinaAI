import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  deleteAnalysis,
  getAnalysis,
  getCroppedPreviewBlob,
  getHeatmapBlob,
  getImageBlob,
  listAnalyses,
  saveAnalysis,
} from "../lib/storage";
import type { AnalysisRecord } from "../lib/types";
import { toBackendFields } from "../lib/analyzeFlow";
import { analyzeImage } from "../lib/api";
import { usePreferences } from "../hooks/usePreferences";
import { useToast } from "../hooks/useToast";
import { useShortcutListener } from "../hooks/useShortcutListener";
import { exportAnalysisJson } from "../lib/export";
import ImageViewer from "../components/ImageViewer";
import ResultsPanel from "../components/ResultsPanel";
import AnalysisReport from "../components/AnalysisReport";
import QualityPanel from "../components/QualityPanel";
import StudyInfoPanel from "../components/StudyInfoPanel";
import WorkflowStages from "../components/WorkflowStages";
import { deriveStages } from "../lib/workflow";
import { Button, Callout, Icon, Skeleton, IndeterminateBar } from "../components/ui";

interface EphemeralState {
  record: AnalysisRecord;
  file: File;
}

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { preferences } = usePreferences();
  const toast = useToast();
  const ephemeral = (location.state as EphemeralState | undefined) ?? null;

  const [record, setRecord] = useState<AnalysisRecord | null | undefined>(
    ephemeral ? ephemeral.record : undefined,
  );
  const [sourceFile, setSourceFile] = useState<File | Blob | null>(
    ephemeral?.file ?? null,
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(
    null,
  );
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [neighbors, setNeighbors] = useState<{ prev: string | null; next: string | null }>({
    prev: null,
    next: null,
  });

  // Stable indirection so the global "A" shortcut can call whatever the
  // current handleAnalyzeNow closure is, even though that closure is
  // defined below the loading/not-found guards (it needs `record`
  // narrowed to non-null) and this hook has to run unconditionally above
  // them.
  const analyzeNowRef = useRef<() => void>(() => {});
  useShortcutListener("analyze", () => analyzeNowRef.current());

  // History's default (newest-first) order, so ←/→ step chronologically.
  useEffect(() => {
    if (!id || ephemeral) return;
    void listAnalyses().then((all) => {
      const index = all.findIndex((r) => r.id === id);
      if (index === -1) return;
      setNeighbors({
        prev: all[index + 1]?.id ?? null,
        next: all[index - 1]?.id ?? null,
      });
    });
  }, [id, ephemeral]);
  useShortcutListener("prev", () => {
    if (neighbors.prev) navigate(`/analysis/${neighbors.prev}`);
  });
  useShortcutListener("next", () => {
    if (neighbors.next) navigate(`/analysis/${neighbors.next}`);
  });

  useEffect(() => {
    if (!id || ephemeral) return;
    const objectUrls: string[] = [];
    let cancelled = false;

    void Promise.all([
      getAnalysis(id),
      getImageBlob(id),
      getCroppedPreviewBlob(id),
      getHeatmapBlob(id),
    ]).then(([rec, blob, croppedBlob, heatmapBlob]) => {
      if (cancelled) return;
      setRecord(rec ?? null);
      if (blob) {
        setSourceFile(blob);
        const url = URL.createObjectURL(blob);
        objectUrls.push(url);
        setImageUrl(url);
      }
      if (croppedBlob) {
        const url = URL.createObjectURL(croppedBlob);
        objectUrls.push(url);
        setCroppedPreviewUrl(url);
      }
      if (heatmapBlob) {
        const url = URL.createObjectURL(heatmapBlob);
        objectUrls.push(url);
        setHeatmapUrl(url);
      }
    });

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [id, ephemeral]);

  // The ephemeral path (storage disabled) never touched IndexedDB, so its
  // image URL comes straight from the File already in memory.
  useEffect(() => {
    if (!ephemeral) return;
    const url = URL.createObjectURL(ephemeral.file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [ephemeral]);

  if (record === undefined) {
    // Skeleton in the shape of the workspace, so the layout doesn't jump
    // when the record resolves.
    return (
      <div className="flex h-full">
        <div className="flex-1 min-w-0 p-4">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
        <div className="hidden lg:block w-[22rem] xl:w-[26rem] shrink-0 border-l border-clinic-200 bg-surface p-5 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (record === null || !id) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-clinic-200 bg-surface">
            <Icon name="image" className="w-5 h-5 text-clinic-400" />
          </div>
          <p className="mt-3 font-medium text-clinic-800">Analysis not found</p>
          <p className="mt-1 text-sm text-clinic-500 leading-relaxed">
            This analysis isn't stored on this device. It may have been deleted,
            or opened in a different browser.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button onClick={() => navigate("/analyze")} variant="primary">
              Analyze an image
            </Button>
            <Button onClick={() => navigate("/history")}>View history</Button>
          </div>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!ephemeral) await deleteAnalysis(id);
    toast.success("Analysis deleted.");
    navigate("/");
  };

  const handleAnalyzeNow = async () => {
    if (!sourceFile) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const file =
        sourceFile instanceof File
          ? sourceFile
          : new File([sourceFile], record.filename, { type: record.mimeType });
      const result = await analyzeImage(file);
      if (!result) {
        const message = "The backend is unreachable — try again once it's running.";
        setAnalyzeError(message);
        toast.error(message);
        return;
      }
      if ("code" in result) {
        setAnalyzeError(result.message);
        toast.error(result.message);
        return;
      }

      // Re-uses the field mapping from lib/analyzeFlow.ts, but not
      // runAnalysis: this updates an existing record in place rather than
      // creating one, and folding both into a single function would mean a
      // flag argument that changes what it fundamentally does.
      const updated: AnalysisRecord = {
        ...record,
        ...toBackendFields(result),
        awaitingManualAnalysis: false,
      };
      setRecord(updated);
      if (result.croppedPreviewBlob) {
        setCroppedPreviewUrl(URL.createObjectURL(result.croppedPreviewBlob));
      }
      if (result.heatmapBlob) {
        setHeatmapUrl(URL.createObjectURL(result.heatmapBlob));
      }

      if (preferences.storeAnalysisResults && !ephemeral) {
        await saveAnalysis(
          updated,
          sourceFile,
          result.croppedPreviewBlob && result.heatmapBlob
            ? {
                croppedPreviewBlob: result.croppedPreviewBlob,
                heatmapBlob: result.heatmapBlob,
              }
            : undefined,
        );
      }
      toast.success("Analysis complete.");
    } finally {
      setAnalyzing(false);
    }
  };

  analyzeNowRef.current = () => void handleAnalyzeNow();

  const handleExportJson = () => {
    exportAnalysisJson(record, preferences.anonymizeExports);
    toast.success("JSON exported.");
  };

  const handleExportReport = () => {
    window.print();
  };

  const stages = deriveStages({ record, busy: analyzing });

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Workspace header: identity on the left, actions on the right, and
          the workflow strip beneath. One 3-row band instead of the previous
          title block + banner + button row. */}
      <div className="shrink-0 border-b border-clinic-200 bg-surface">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-clinic-900" title={record.filename}>
                {record.label ?? record.filename}
              </h1>
              {ephemeral && (
                <span
                  className="shrink-0 rounded bg-warn-soft px-1.5 py-0.5 text-[11px] font-medium text-warn-soft-ink"
                  title={'Saving is off (Settings → History & Storage). This analysis will be gone when you navigate away.'}
                >
                  Not saved
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Button
              onClick={() => neighbors.prev && navigate(`/analysis/${neighbors.prev}`)}
              disabled={!neighbors.prev}
              iconOnly
              aria-label="Previous analysis"
              title="Previous analysis (←)"
            >
              <Icon name="chevron-left" className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => neighbors.next && navigate(`/analysis/${neighbors.next}`)}
              disabled={!neighbors.next}
              iconOnly
              aria-label="Next analysis"
              title="Next analysis (→)"
            >
              <Icon name="chevron-right" className="w-4 h-4" />
            </Button>
            <div className="mx-1 h-5 w-px bg-clinic-200" aria-hidden="true" />
            <Button onClick={handleExportJson} title="Download this analysis as JSON">
              <Icon name="download" className="w-4 h-4" />
              <span className="hidden sm:inline">JSON</span>
            </Button>
            <Button onClick={handleExportReport} title="Open a printable report">
              <Icon name="print" className="w-4 h-4" />
              <span className="hidden sm:inline">Report</span>
            </Button>
            {!ephemeral && (
              <Button
                onClick={() => void handleDelete()}
                variant="danger"
                iconOnly
                aria-label="Delete analysis"
                title="Delete this analysis"
              >
                <Icon name="trash" className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="border-t border-clinic-100 bg-surface-raised px-4 py-2">
          <WorkflowStages stages={stages} />
        </div>
        {analyzing && <IndeterminateBar />}
      </div>

      {/* Two-panel workspace at lg and up: image left, analysis right, each
          scrolling independently so the image never moves while reading the
          results. Below lg there isn't room for two panels side by side, so
          they stack and the whole workspace scrolls as one column — trying to
          keep both panels in a fixed-height shell at that width squeezes them
          into each other. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto panel-scroll lg:flex-row lg:overflow-hidden">
        <div className="flex flex-col bg-canvas p-3 lg:min-h-0 lg:flex-1">
          {imageUrl ? (
            <div className="h-[55vh] shrink-0 overflow-hidden rounded-lg border border-chrome-700 lg:h-auto lg:min-h-[22rem] lg:flex-1 lg:shrink">
              <ImageViewer
                imageUrl={imageUrl}
                croppedPreviewUrl={croppedPreviewUrl}
                heatmapUrl={heatmapUrl}
                altText={`Retinal fundus photograph: ${record.filename}`}
                caption={record.filename}
                fill
              />
            </div>
          ) : (
            <Skeleton className="h-[55vh] shrink-0 rounded-lg lg:h-auto lg:min-h-[22rem] lg:flex-1" />
          )}

          <p className="mt-2 shrink-0 px-1 text-[11px] leading-relaxed text-clinic-500">
            {heatmapUrl ? (
              <>
                Highlighted regions represent areas that contributed more strongly to the
                model's prediction. This visualization does not prove that these regions
                contain disease. Heatmap and overlay views show the cropped, resized image
                the model actually analyzed — not the original upload — since the heatmap's
                coordinates only apply to that frame.
              </>
            ) : (
              <>
                No Grad-CAM heatmap is available for this image. Explanations are only
                produced when a trained model runs.
              </>
            )}
          </p>
        </div>

        {/* Analysis panel. Scrolls independently so the image never moves. */}
        <aside
          className="flex w-full shrink-0 flex-col border-t border-clinic-200 bg-surface lg:w-[22rem] lg:min-h-0 lg:overflow-hidden lg:border-l lg:border-t-0 xl:w-[26rem]"
          aria-label="Analysis results"
        >
          <StudyInfoPanel record={record} defaultOpen={false} />

          <div className="p-4 space-y-4 lg:panel-scroll lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {record.awaitingManualAnalysis && !record.prediction && (
              <Callout
                tone="accent"
                title="Not analyzed yet"
                actions={
                  <Button
                    variant="primary"
                    onClick={() => void handleAnalyzeNow()}
                    disabled={analyzing || !sourceFile}
                  >
                    {analyzing ? "Analyzing…" : "Run analysis"}
                  </Button>
                }
              >
                Automatic analysis is off (Settings → AI Analysis).
              </Callout>
            )}

            {analyzeError && (
              <Callout tone="danger" role="alert" title="Analysis failed">
                {analyzeError}
              </Callout>
            )}

            {analyzing && (
              <Callout tone="accent" role="status" title="Running analysis">
                Preprocessing, classifying, and generating the Grad-CAM explanation.
                This runs on the CPU and usually takes a few seconds.
              </Callout>
            )}

            <ResultsPanel record={record} />
            <QualityPanel record={record} />
          </div>
        </aside>
      </div>

      <AnalysisReport
        record={record}
        imageUrl={imageUrl}
        heatmapUrl={heatmapUrl}
        anonymize={preferences.anonymizeExports}
        includeImages={preferences.includeImagesInReport}
      />
    </div>
  );
}
