import { usePreferences } from "../hooks/usePreferences";
import SettingsToggle from "./SettingsToggle";

export default function AccessibilitySettings() {
  const { preferences, setPreference } = usePreferences();

  return (
    <div>
      <div className="divide-y divide-clinic-100">
        <SettingsToggle
          label="Larger text"
          description="Scales all text in the app up by 12.5%."
          checked={preferences.largerText}
          onChange={(v) => setPreference("largerText", v)}
        />
        <SettingsToggle
          label="High contrast"
          description="Darkens secondary text and thickens borders for better separation."
          checked={preferences.highContrast}
          onChange={(v) => setPreference("highContrast", v)}
        />
        <SettingsToggle
          label="Reduce motion"
          description="Same effect as Appearance → Reduce animations — shown here too since it's an accessibility need for some people."
          checked={preferences.reduceMotion}
          onChange={(v) => setPreference("reduceMotion", v)}
        />
        <SettingsToggle
          label="Always show text labels for icons"
          description="Adds visible text next to icon-only controls, like the delete button on thumbnails."
          checked={preferences.alwaysShowIconLabels}
          onChange={(v) => setPreference("alwaysShowIconLabels", v)}
        />
      </div>
      <p className="mt-4 pt-4 border-t border-clinic-100 text-xs text-clinic-500 leading-relaxed">
        Keyboard navigation and screen-reader labeling are built into every
        page — there's nothing to turn on. If you find something that
        doesn't work with a keyboard or screen reader, that's a bug, not a
        missing setting.
      </p>
    </div>
  );
}
