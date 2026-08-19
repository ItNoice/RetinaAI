import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  deleteAnalysis,
  getAnalysis,
  getCroppedPreviewBlob,
  getHeatmapBlob,
  getImageBlob,
  saveAnalysis,
} from "../lib/storage";
import type { AnalysisRecord } from "../lib/types";
import { analyzeImage } from "../lib/api";
import { usePreferences } from "../hooks/usePreferences";
import ImageViewer from "../components/ImageViewer";
import ResultsPanel from "../components/ResultsPanel";

interface EphemeralState {
  record: AnalysisRecord;
  file: File;
}

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { preferences } = usePreferences();
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
    return <p className="text-sm text-clinic-500">Loading analysis…</p>;
  }

  if (record === null || !id) {
    return (
      <div className="text-center py-16">
        <p className="text-clinic-700 font-medium">Analysis not found</p>
        <p className="text-sm text-clinic-500 mt-1">
          It may have been deleted from this device.
        </p>
        <Link
          to="/"
          className="mt-4 inline-block text-sm text-accent-600 underline"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!ephemeral) await deleteAnalysis(id);
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
        setAnalyzeError("The backend is unreachable — try again once it's running.");
        return;
      }
      if ("code" in result) {
        setAnalyzeError(result.message);
        return;
      }

      const updated: AnalysisRecord = {
        ...record,
        prediction: result.prediction,
        quality: result.quality,
        backend: {
          croppedWidth: result.croppedWidth,
          croppedHeight: result.croppedHeight,
          preprocessingTimeMs: result.preprocessingTimeMs,
        },
        hasExplainability: Boolean(result.croppedPreviewBlob && result.heatmapBlob),
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
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/"
            className="text-xs text-clinic-500 hover:text-clinic-700 inline-flex items-center gap-1"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-semibold text-clinic-900 mt-1 truncate max-w-md">
            {record.filename}
          </h1>
          {ephemeral && (
            <p className="text-xs text-warn-soft-ink mt-1">
              Not saved — "Save analysis results" is off (Settings → History
              &amp; Storage). This won't be here after you navigate away.
            </p>
          )}
        </div>
        {!ephemeral && (
          <button
            type="button"
            onClick={() => void handleDelete()}
            className="text-sm text-danger-soft-ink border border-danger-500/30 bg-danger-soft hover:opacity-80 px-3 py-1.5 rounded-md transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-danger-500"
          >
            Delete analysis
          </button>
        )}
      </div>

      {record.awaitingManualAnalysis && !record.prediction && (
        <div className="rounded-lg border border-accent-400/40 bg-accent-soft px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-accent-soft-ink">
            This image hasn't been analyzed yet — automatic analysis is off
            (Settings → AI Analysis).
          </p>
          <button
            type="button"
            onClick={() => void handleAnalyzeNow()}
            disabled={analyzing || !sourceFile}
            className="shrink-0 rounded-md bg-accent-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-accent-700 disabled:opacity-50 transition-colors"
          >
            {analyzing ? "Analyzing…" : "Analyze now"}
          </button>
        </div>
      )}
      {analyzeError && (
        <p role="alert" className="text-sm text-danger-soft-ink bg-danger-soft border border-danger-500/30 rounded-md px-3 py-2">
          {analyzeError}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-3">
          {imageUrl ? (
            <ImageViewer
              imageUrl={imageUrl}
              croppedPreviewUrl={croppedPreviewUrl}
              heatmapUrl={heatmapUrl}
              altText={`Retinal fundus photograph: ${record.filename}`}
            />
          ) : (
            <div className="h-96 rounded-lg bg-clinic-100 animate-pulse" />
          )}
          <p className="text-xs text-clinic-500 leading-relaxed">
            {heatmapUrl ? (
              <>
                Highlighted regions represent areas that contributed more
                strongly to the model's prediction. This visualization does
                not prove that these regions contain disease. The heatmap
                and overlay views show the cropped, resized image the model
                actually analyzed — not the original upload — since the
                heatmap's coordinates only apply to that frame.
              </>
            ) : (
              <>
                Highlighted regions represent areas that contributed more
                strongly to the model's prediction. This visualization does
                not prove that these regions contain disease. No heatmap is
                available for this image.
              </>
            )}
          </p>
        </div>

        <div className="lg:col-span-2">
          <ResultsPanel record={record} />
        </div>
      </div>
    </div>
  );
}
