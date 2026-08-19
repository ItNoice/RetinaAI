import type { ReactNode } from "react";
import SettingsSection from "../components/SettingsSection";
import AppearanceSettings from "../components/AppearanceSettings";

// Each entry is one self-contained settings group. To add a new setting
// later: build a small component like AppearanceSettings (it owns its own
// state/persistence — AppearanceSettings uses useTheme/localStorage), then
// add one entry here. Nothing else on this page needs to change.
interface SettingsGroup {
  id: string;
  title: string;
  description?: string;
  render: () => ReactNode;
}

const SETTINGS_SECTIONS: SettingsGroup[] = [
  {
    id: "appearance",
    title: "Appearance",
    description: "Choose how RetinaAI looks on this device.",
    render: () => <AppearanceSettings />,
  },
];

export default function Settings() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-clinic-900">
          Settings
        </h1>
        <p className="mt-2 text-clinic-600 leading-relaxed">
          Preferences are stored locally in this browser only.
        </p>
      </div>

      <div className="space-y-4">
        {SETTINGS_SECTIONS.map((section) => (
          <SettingsSection
            key={section.id}
            title={section.title}
            description={section.description}
          >
            {section.render()}
          </SettingsSection>
        ))}
      </div>
    </div>
  );
}
