import type { ReactNode } from "react";

// A consistent wrapper for one group of related settings on the Settings
// page — see pages/Settings.tsx's SETTINGS_SECTIONS array for how new
// sections get added.
export default function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-clinic-200 bg-surface p-5">
      <h2 className="text-sm font-semibold text-clinic-900">{title}</h2>
      {description && (
        <p className="mt-1 text-xs text-clinic-500 leading-relaxed">
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}
