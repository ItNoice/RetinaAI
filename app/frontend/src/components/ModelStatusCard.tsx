import { useModelStatus } from "../hooks/useStatus";

export default function ModelStatusCard() {
  const { status, backendReachable } = useModelStatus();
  const { available } = status;

  return (
    <div className="rounded-lg border border-clinic-200 bg-surface p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-clinic-900">
          Model status
        </h3>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
            available
              ? "bg-ok-soft text-ok-soft-ink"
              : "bg-clinic-100 text-clinic-500"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              available ? "bg-ok-500" : "bg-clinic-400"
            }`}
            aria-hidden="true"
          />
          {available ? "Online" : "Unavailable"}
        </span>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-clinic-500">Task</dt>
          <dd className="text-clinic-800 text-right">{status.task}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-clinic-500">Architecture</dt>
          <dd className="text-clinic-800 tabular">
            {status.architecture ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-clinic-500">Version</dt>
          <dd className="text-clinic-800 tabular">{status.version ?? "—"}</dd>
        </div>
      </dl>

      <p className="mt-3 pt-3 border-t border-clinic-100 text-xs text-clinic-500 leading-relaxed">
        {status.note}
        {!backendReachable && (
          <>
            {" "}
            Backend API is unreachable — showing the last known/default
            status.
          </>
        )}
      </p>
    </div>
  );
}
