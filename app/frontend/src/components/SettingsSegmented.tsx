export default function SettingsSegmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  hint?: string;
}) {
  const labelId = `segmented-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="py-2">
      <span className="text-sm text-clinic-700" id={labelId}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="mt-2 inline-flex items-center rounded-md bg-clinic-100 p-1 text-sm flex-wrap"
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={`px-3.5 py-1.5 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
              value === opt.value
                ? "bg-surface text-clinic-900 shadow-sm font-medium"
                : "text-clinic-600 hover:text-clinic-900"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {hint && <p className="mt-2 text-xs text-clinic-500">{hint}</p>}
    </div>
  );
}
