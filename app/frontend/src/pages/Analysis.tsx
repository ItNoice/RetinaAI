import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  deleteAnalysis,
  getAnalysis,
  getCroppedPreviewBlob,
  getHeatmapBlob,
  getImageBlob,
} from "../lib/storage";
import type { AnalysisRecord } from "../lib/types";
import ImageViewer from "../components/ImageViewer";
import ResultsPanel from "../components/ResultsPanel";

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<AnalysisRecord | null | undefined>(
    undefined,
  );
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState<string | null>(
    null,
  );
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
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
  }, [id]);

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
    await deleteAnalysis(id);
    navigate("/");
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
        </div>
        <button
          type="button"
          onClick={() => void handleDelete()}
          className="text-sm text-danger-soft-ink border border-danger-500/30 bg-danger-soft hover:opacity-80 px-3 py-1.5 rounded-md transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-danger-500"
        >
          Delete analysis
        </button>
      </div>

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
