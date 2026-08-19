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

function App() {
  const { preferences, setPreference } = usePreferences();
  const { backendReachable } = useModelStatus();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const commandPalette = useCommandPalette();
  const location = useLocation();

  const onHelp = useCallback(() => setHelpOpen((v) => !v), []);
  useKeyboardShortcuts(onHelp);

  return (
    <div className="min-h-screen flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-surface focus:text-clinic-900 focus:px-3 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="border-b border-clinic-200 bg-surface">
          <div className="flex items-center gap-3 h-14 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
              className="lg:hidden -ml-1 p-1.5 rounded-md text-clinic-600 hover:bg-clinic-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              </svg>
            </button>

            <Breadcrumbs />

            <div className="flex-1" />

            <button
              type="button"
              onClick={commandPalette.open}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-clinic-500 hover:text-clinic-800 transition-colors px-2 py-1 rounded-md border border-clinic-200 hover:bg-clinic-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              <span>Search</span>
              <span className="font-mono text-[10px] text-clinic-400">⌘K</span>
            </button>

            {preferences.researchMode && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-accent-soft-ink bg-accent-soft px-2 py-1 rounded">
                RESEARCH MODE
              </span>
            )}
            <button
              type="button"
              onClick={() => setPreference("researchMode", !preferences.researchMode)}
              className="text-xs text-clinic-500 hover:text-clinic-800 transition-colors px-2 py-1 rounded-md hover:bg-clinic-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              aria-pressed={preferences.researchMode}
            >
              {preferences.researchMode ? "Exit research mode" : "Research mode"}
            </button>
          </div>
          <div className="bg-warn-soft border-t border-warn-500/30">
            <p className="px-4 sm:px-6 py-1 text-xs text-warn-soft-ink text-center">
              Research prototype — not a medical device.{" "}
              <NavLink to="/about" className="underline font-medium">
                Read the full disclaimer
              </NavLink>
              .
            </p>
          </div>
        </div>

        <main id="main-content" className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-6xl">
          <div key={location.pathname} style={{ animation: "page-fade-in 0.15s ease-out" }}>
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-clinic-200 bg-surface">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-xs text-clinic-500 flex flex-col sm:flex-row gap-2 sm:justify-between">
            <span>RetinaAI — educational &amp; research prototype.</span>
            <div className="flex items-center gap-4">
              <span>All analysis data stays on this device.</span>
              {preferences.showLocalProcessingIndicator && (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      backendReachable ? "bg-ok-500" : "bg-clinic-400"
                    }`}
                    aria-hidden="true"
                  />
                  {backendReachable
                    ? "Processing locally (backend on this device)"
                    : "Backend unreachable"}
                </span>
              )}
            </div>
          </div>
        </footer>
      </div>

      <CommandPalette />
      {helpOpen && <ShortcutHelpModal onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

export default App;
