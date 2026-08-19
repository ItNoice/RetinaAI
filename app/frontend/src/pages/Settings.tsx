import type { ReactNode } from "react";
import SettingsSection from "../components/SettingsSection";
import AppearanceSettings from "../components/AppearanceSettings";
import ImageViewerSettings from "../components/ImageViewerSettings";
import AIAnalysisSettings from "../components/AIAnalysisSettings";
import ResearchSettings from "../components/ResearchSettings";
import StorageSettings from "../components/StorageSettings";
import PrivacySettings from "../components/PrivacySettings";
import AccessibilitySettings from "../components/AccessibilitySettings";
import AdvancedSettings from "../components/AdvancedSettings";
import ShortcutsSettings from "../components/ShortcutsSettings";

// Each entry is one self-contained settings group. To add a new setting
// later: build a small component like AppearanceSettings (it owns its own
// state/persistence via usePreferences), then add one entry here. Nothing
// else on this page needs to change.
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
  {
    id: "image-viewer",
    title: "Image Viewer",
    description: "Defaults for the retinal image viewer.",
    render: () => <ImageViewerSettings />,
  },
  {
    id: "ai-analysis",
    title: "AI Analysis",
    description: "What runs automatically and what's shown on results.",
    render: () => <AIAnalysisSettings />,
  },
  {
    id: "research",
    title: "Research",
    description: "What's shown on the Research page.",
    render: () => <ResearchSettings />,
  },
  {
    id: "history-storage",
    title: "History & Storage",
    description: "Manage what's kept on this device.",
    render: () => <StorageSettings />,
  },
  {
    id: "privacy",
    title: "Privacy",
    render: () => <PrivacySettings />,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    render: () => <AccessibilitySettings />,
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    description: "Click a binding to record a new key for it.",
    render: () => <ShortcutsSettings />,
  },
  {
    id: "advanced",
    title: "Advanced",
    render: () => <AdvancedSettings />,
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
