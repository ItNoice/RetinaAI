/**
 * Loading placeholders.
 *
 * The brief asks for skeletons over spinners: a skeleton shows the shape of
 * what's arriving, which reads as less anxious than an indeterminate spinner
 * next to a medical image.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-clinic-100 ${className}`}
      aria-hidden="true"
    />
  );
}

/** A determinate-looking bar for work whose duration we genuinely can't
 *  predict. Labelled by the caller, never on its own. */
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
