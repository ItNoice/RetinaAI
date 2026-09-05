import { useMemo, useState, type ReactNode } from "react";
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
import { usePreferences } from "../hooks/usePreferences";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";

// Each entry is one self-contained settings group. To add a new setting
// later: build a small component like AppearanceSettings (it owns its own
// state/persistence via usePreferences), then add one entry here. Nothing
// else on this page needs to change. `keywords` is a flat list of the
// individual setting labels inside that section, so the search box below
// can match on them without every sub-component needing to expose its own
// searchable index.
interface SettingsGroup {
  id: string;
  title: string;
  description?: string;
  keywords: string;
  render: () => ReactNode;
}

const SETTINGS_SECTIONS: SettingsGroup[] = [
  {
    id: "appearance",
    title: "Appearance",
    description: "Choose how RetinaAI looks on this device.",
    keywords: "theme dark light accent color density compact reduce animations motion",
    render: () => <AppearanceSettings />,
  },
  {
    id: "image-viewer",
    title: "Image Viewer",
    description: "Defaults for the retinal image viewer.",
    keywords:
      "zoom default view heatmap opacity brightness contrast remember position image info quality auto-enhance",
    render: () => <ImageViewerSettings />,
  },
  {
    id: "ai-analysis",
    title: "AI Analysis",
    description: "What runs automatically and what's shown on results.",
    keywords:
      "auto-analyze upload confidence probability distribution model info processing time grad-cam experimental",
    render: () => <AIAnalysisSettings />,
  },
  {
    id: "research",
    title: "Research",
    description: "What's shown on the Research page.",
    keywords: "research mode advanced metrics confusion matrix per-class dataset statistics decimal places",
    render: () => <ResearchSettings />,
  },
  {
    id: "history-storage",
    title: "History & Storage",
    description: "Manage what's kept on this device.",
    keywords: "auto-delete clear history cache images local data",
    render: () => <StorageSettings />,
  },
  {
    id: "privacy",
    title: "Privacy",
    keywords: "store analysis results images local processing indicator anonymize export report",
    render: () => <PrivacySettings />,
  },
  {
    id: "accessibility",
    title: "Accessibility",
    keywords: "larger text high contrast reduce motion icon labels screen reader keyboard navigation",
    render: () => <AccessibilitySettings />,
  },
  {
    id: "keyboard-shortcuts",
    title: "Keyboard Shortcuts",
    description: "Click a binding to record a new key for it.",
    keywords: "shortcuts hotkeys upload analyze fullscreen zoom command palette",
    render: () => <ShortcutsSettings />,
  },
  {
    id: "advanced",
    title: "Advanced",
    keywords: "inference device resolution api endpoint debug logging reload model cache developer",
    render: () => <AdvancedSettings />,
  },
];

export default function Settings() {
  const { resetPreferences } = usePreferences();
  const { setTheme } = useTheme();
  const toast = useToast();
  const [search, setSearch] = useState("");

  const visibleSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return SETTINGS_SECTIONS;
    return SETTINGS_SECTIONS.filter((s) =>
      `${s.title} ${s.description ?? ""} ${s.keywords}`.toLowerCase().includes(q),
    );
  }, [search]);

  const handleReset = () => {
    const confirmed = window.confirm(
      "Reset all settings to their defaults? This does not delete your analysis history.",
    );
    if (!confirmed) return;
    resetPreferences();
    setTheme("system");
    toast.success("Settings reset to defaults.");
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-clinic-900">
          Settings
        </h1>
        <p className="mt-2 text-clinic-600 leading-relaxed">
          Preferences are stored locally in this browser only.
        </p>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search settings…"
        aria-label="Search settings"
        className="w-full rounded-md border border-clinic-200 bg-surface px-3.5 py-2 text-sm text-clinic-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
      />

      {visibleSections.length === 0 ? (
        <p className="text-sm text-clinic-500">No settings match "{search}".</p>
      ) : (
        <div className="space-y-4">
          {visibleSections.map((section) => (
            <SettingsSection
              key={section.id}
              title={section.title}
              description={section.description}
            >
              {section.render()}
            </SettingsSection>
          ))}
        </div>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-danger-soft-ink hover:opacity-80 transition-opacity font-medium"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
