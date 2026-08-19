import { useEffect, useState } from "react";
import { getHeatmapBlob, getImageBlob } from "../lib/storage";

export default function AnalysisThumbnail({
  id,
  alt,
  kind = "image",
}: {
  id: string;
  alt: string;
  kind?: "image" | "heatmap";
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    const getBlob = kind === "heatmap" ? getHeatmapBlob : getImageBlob;
    void getBlob(id).then((blob) => {
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, kind]);

  if (!url) {
    return (
      <div
        className="w-full h-full bg-clinic-100 animate-pulse"
        aria-hidden="true"
      />
    );
  }

  return <img src={url} alt={alt} className="w-full h-full object-cover" />;
}
