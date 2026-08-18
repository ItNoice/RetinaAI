export default function DisclaimerBanner() {
  return (
    <div
      role="note"
      aria-label="Medical disclaimer"
      className="rounded-lg border border-warn-500/40 bg-warn-100 px-4 py-3.5 flex gap-3"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        className="w-5 h-5 shrink-0 text-warn-700 mt-0.5"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l6.28 11.18c.75 1.334-.213 2.987-1.743 2.987H3.72c-1.53 0-2.493-1.653-1.743-2.987l6.28-11.18zM11 14a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.5a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"
          clipRule="evenodd"
        />
      </svg>
      <p className="text-sm text-warn-700 leading-relaxed">
        <strong className="font-semibold">
          This project is an educational and research prototype.
        </strong>{" "}
        It is not a medical device and should not be used to diagnose, treat,
        or make clinical decisions about any person. Model predictions may be
        incorrect and performance may differ across populations, cameras,
        image quality, and clinical settings.
      </p>
    </div>
  );
}
