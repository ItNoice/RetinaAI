import { useDatasetStatus } from "../hooks/useStatus";

export default function DatasetInfoCard() {
  const { status } = useDatasetStatus();

  return (
    <div className="rounded-lg border border-clinic-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-clinic-900 mb-3">
        Dataset &amp; model provenance
      </h3>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-clinic-500">Dataset</dt>
          <dd className="text-clinic-800 text-right">
            {status.name ?? "Not yet integrated"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-clinic-500">License</dt>
          <dd className="text-clinic-800 text-right">
            {status.license ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-clinic-500">Images</dt>
          <dd className="text-clinic-800 tabular">
            {status.numImages ?? "—"}
          </dd>
        </div>
      </dl>
      <p className="mt-3 pt-3 border-t border-clinic-100 text-xs text-clinic-500 leading-relaxed">
        {status.note} See{" "}
        <code className="font-mono text-[11px] bg-clinic-100 px-1 py-0.5 rounded">
          DATASET.md
        </code>{" "}
        for full details once available.
      </p>
    </div>
  );
}
