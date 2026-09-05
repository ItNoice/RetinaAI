import { useCallback, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Breadcrumbs from "./components/Breadcrumbs";
import CommandPalette from "./components/CommandPalette";
import { useCommandPalette } from "./hooks/useCommandPalette";
import ShortcutHelpModal from "./components/ShortcutHelpModal";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { usePreferences } from "./hooks/usePreferences";
import { useModelStatus } from "./hooks/useStatus";
import { Icon, StatusDot } from "./components/ui";
import { formatShortcutBinding } from "./lib/formatShortcut";

// Routes where the image is the subject, so they take the full viewport — a
// text-measure column wastes the space the image wants and pushes the analysis
// panel below the fold.
const WORKSPACE_ROUTES = [/^\/analysis\/[^/]+$/, /^\/analyze$/, /^\/$/];

function isWorkspaceRoute(pathname: string): boolean {
  return WORKSPACE_ROUTES.some((re) => re.test(pathname));
}

function App() {
  const { preferences, setPreference } = usePreferences();
  const { backendReachable } = useModelStatus();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const commandPalette = useCommandPalette();
  const location = useLocation();

  const onHelp = useCallback(() => setHelpOpen((v) => !v), []);
  useKeyboardShortcuts(onHelp);

  const workspace = isWorkspaceRoute(location.pathname);

  return (
    <div className="h-screen flex overflow-hidden bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-surface focus:text-clinic-900 focus:px-3 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* One dark band shared with the rail in either theme, the way an
            imaging workstation separates controls from the image. */}
        <header className="shrink-0 bg-chrome-900 border-b border-chrome-700">
          <div className="flex items-center gap-3 h-12 px-3 sm:px-4">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden -ml-1 p-1.5 rounded-md text-chrome-300 hover:text-white hover:bg-chrome-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <Icon name="menu" className="w-5 h-5" />
            </button>

            <Breadcrumbs />

            <div className="flex-1" />

            {/* On every page, as it must be — inline so it costs a chip rather
                than a strip, and doesn't read as a dismissible cookie bar. */}
            <NavLink
              to="/about"
              className="hidden md:inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium text-warn-soft-ink bg-warn-soft/90 hover:bg-warn-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              title="This is a research prototype, not a medical device. Read the full disclaimer."
            >
              <Icon name="alert" className="w-3.5 h-3.5" />
              Research prototype — not a medical device
            </NavLink>

            <button
              type="button"
              onClick={commandPalette.open}
              className="hidden sm:inline-flex items-center gap-2 rounded-md border border-chrome-700 bg-chrome-800 px-2 py-1 text-xs text-chrome-300 hover:text-white hover:border-chrome-700 hover:bg-chrome-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <span>Search</span>
              {/* The binding is rebindable in Settings, and "mod" renders as
                  Ctrl off macOS — so read it rather than hardcoding ⌘K. */}
              <span className="font-mono text-[10px] text-chrome-300/70">
                {formatShortcutBinding(preferences.shortcutBindings.commandPalette)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPreference("researchMode", !preferences.researchMode)}
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
                preferences.researchMode
                  ? "bg-accent-600/20 text-accent-400"
                  : "text-chrome-300 hover:text-white hover:bg-chrome-700/60"
              }`}
              aria-pressed={preferences.researchMode}
              title={
                preferences.researchMode
                  ? "Research mode is on — advanced metrics and evaluation pages are visible"
                  : "Turn on research mode to show evaluation metrics and training pages"
              }
            >
              <StatusDot tone={preferences.researchMode ? "accent" : "neutral"} />
              Research
            </button>
          </div>

          {/* Narrow screens, where the chip above is hidden. */}
          <NavLink
            to="/about"
            className="md:hidden block bg-warn-soft px-4 py-1 text-center text-[11px] text-warn-soft-ink"
          >
            Research prototype — not a medical device.
          </NavLink>
        </header>

        <main
          id="main-content"
          className={
            workspace
              ? "flex-1 min-h-0 overflow-hidden"
              : "flex-1 min-h-0 overflow-y-auto panel-scroll"
          }
        >
          {workspace ? (
            <div
              key={location.pathname}
              className="h-full"
              style={{ animation: "page-fade-in 0.15s ease-out" }}
            >
              <Outlet />
            </div>
          ) : (
            <div className="flex min-h-full flex-col">
              <div
                key={location.pathname}
                className="w-full flex-1 mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl"
                style={{ animation: "page-fade-in 0.15s ease-out" }}
              >
                <Outlet />
              </div>
              <footer className="border-t border-clinic-200 bg-surface">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 text-xs text-clinic-500 flex flex-col sm:flex-row gap-2 sm:justify-between">
                  <span>RetinaAI — educational &amp; research prototype.</span>
                  <div className="flex items-center gap-4">
                    <span>All analysis data stays on this device.</span>
                    {preferences.showLocalProcessingIndicator && (
                      <span className="inline-flex items-center gap-1.5">
                        <StatusDot tone={backendReachable ? "ok" : "neutral"} />
                        {backendReachable
                          ? "Processing locally (backend on this device)"
                          : "Backend unreachable"}
                      </span>
                    )}
                  </div>
                </div>
              </footer>
            </div>
          )}
        </main>
      </div>

      <CommandPalette />
      {helpOpen && <ShortcutHelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

export default App;
