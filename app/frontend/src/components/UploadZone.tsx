import { useCallback, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkImageQuality, SUPPORTED_MIME_TYPES } from "../lib/imageQuality";
import { analyzeImage } from "../lib/api";
import { saveAnalysis } from "../lib/storage";
import type { AnalysisRecord } from "../lib/types";

const FORMAT_LABELS = "JPEG, PNG, TIFF, WebP";

export default function UploadZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const inputId = useId();

  const handleFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setError(null);
      setIsProcessing(true);
      try {
        const { check, dimensions } = await checkImageQuality(file);

        if (check.issues.includes("not-an-image")) {
          setError(
            `Unsupported file type. Please upload one of: ${FORMAT_LABELS}.`,
          );
          return;
        }
        if (check.issues.includes("file-too-large")) {
          setError("File is too large. Please upload an image under 25MB.");
          return;
        }
        if (check.issues.includes("corrupted")) {
          setError("This file could not be read as an image. It may be corrupted.");
          return;
        }

        // The backend re-validates and preprocesses (crop/resize) — when
        // reachable, its result is authoritative. When it isn't (not
        // running, offline), we fall back to the client-only check above
        // rather than blocking the upload.
        const backendResult = await analyzeImage(file);

        if (backendResult && "code" in backendResult) {
          setError(backendResult.message);
          return;
        }

        const hasExplainability = Boolean(
          backendResult?.croppedPreviewBlob && backendResult?.heatmapBlob,
        );

        const id = crypto.randomUUID();
        const record: AnalysisRecord = {
          id,
          filename: file.name,
          createdAt: Date.now(),
          width: backendResult?.width ?? dimensions?.width ?? 0,
          height: backendResult?.height ?? dimensions?.height ?? 0,
          fileSizeBytes: file.size,
          mimeType: file.type,
          quality: backendResult?.quality ?? check,
          prediction: backendResult?.prediction ?? null,
          backend: backendResult
            ? {
                croppedWidth: backendResult.croppedWidth,
                croppedHeight: backendResult.croppedHeight,
                preprocessingTimeMs: backendResult.preprocessingTimeMs,
              }
            : undefined,
          hasExplainability,
        };

        await saveAnalysis(
          record,
          file,
          hasExplainability
            ? {
                croppedPreviewBlob: backendResult!.croppedPreviewBlob!,
                heatmapBlob: backendResult!.heatmapBlob!,
              }
            : undefined,
        );
        navigate(`/analysis/${id}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [navigate],
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        aria-describedby={`${inputId}-help`}
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
          void handleFile(e.dataTransfer.files[0]);
        }}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 ${
          isDragging
            ? "border-accent-500 bg-accent-soft/50"
            : "border-clinic-300 bg-surface hover:border-accent-400 hover:bg-clinic-50"
        }`}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={SUPPORTED_MIME_TYPES.join(",")}
          className="sr-only"
          onChange={(e) => void handleFile(e.target.files?.[0])}
          aria-label="Upload retinal fundus photograph"
        />

        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="mx-auto w-10 h-10 text-clinic-400 mb-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 8.25L12 3.75m0 0L7.5 8.25M12 3.75v13.5"
          />
        </svg>

        <p className="text-clinic-800 font-medium">
          Drag and drop a retinal image, or{" "}
          <span className="text-accent-600 underline">browse files</span>
        </p>
        <p id={`${inputId}-help`} className="mt-1.5 text-xs text-clinic-500">
          Supported formats: {FORMAT_LABELS}. Max file size 25MB.
        </p>

        {isProcessing && (
          <p className="mt-3 text-xs text-clinic-500" role="status">
            Reading image…
          </p>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-danger-soft-ink bg-danger-soft border border-danger-500/30 rounded-md px-3 py-2"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-2 transition-colors"
      >
        Upload retinal image
      </button>
    </div>
  );
}
