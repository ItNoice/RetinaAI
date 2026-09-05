// Skeletons over spinners: showing the shape of what's arriving reads as less
// anxious next to a medical image.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-clinic-100 ${className}`}
      aria-hidden="true"
    />
  );
}

/** For work whose duration we can't predict. Labelled by the caller. */
export function IndeterminateBar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative h-0.5 w-full overflow-hidden rounded-full bg-clinic-100 ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-y-0 w-1/4 rounded-full bg-accent-500"
        style={{ animation: "indeterminate-track 1.1s ease-in-out infinite" }}
      />
    </div>
  );
}
