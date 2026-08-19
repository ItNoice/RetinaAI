import { NavLink, Outlet } from "react-router-dom";
import NavDropdown from "./components/NavDropdown";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
    isActive
      ? "bg-accent-soft text-accent-soft-ink"
      : "text-chrome-300 hover:text-white hover:bg-chrome-700/60"
  }`;

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-surface focus:text-clinic-900 focus:px-3 focus:py-2 focus:rounded-md focus:shadow-lg"
      >
        Skip to main content
      </a>

      <header className="bg-chrome-900 border-b border-chrome-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <svg
                width="28"
                height="28"
                viewBox="0 0 32 32"
                aria-hidden="true"
                className="shrink-0"
              >
                <circle cx="16" cy="16" r="16" fill="#0a0d12" />
                <path
                  d="M4 16c3.5-6 8-9 12-9s8.5 3 12 9c-3.5 6-8 9-12 9s-8.5-3-12-9z"
                  fill="none"
                  stroke="#60a5fa"
                  strokeWidth="2"
                />
                <circle cx="16" cy="16" r="4.5" fill="#60a5fa" />
                <circle cx="16" cy="16" r="1.6" fill="#030507" />
              </svg>
              <span className="text-white font-semibold tracking-tight text-lg">
                Retina<span className="text-accent-400">AI</span>
              </span>
            </NavLink>

            <nav aria-label="Primary" className="flex items-center gap-1 flex-wrap">
              <NavLink to="/" end className={navLinkClass}>
                Dashboard
              </NavLink>
              <NavDropdown
                label="Analyze"
                items={[
                  { to: "/history", label: "History" },
                  { to: "/compare", label: "Compare" },
                ]}
              />
              <NavDropdown
                label="Model Lab"
                items={[
                  { to: "/research", label: "Research" },
                  { to: "/experiments", label: "Experiments" },
                ]}
              />
              <NavDropdown
                label="Ophthalmology"
                items={[
                  { to: "/methods", label: "Methods" },
                  { to: "/ethics", label: "Ethics" },
                  { to: "/about", label: "About & Safety" },
                ]}
              />
              <NavLink to="/settings" className={navLinkClass} aria-label="Settings">
                Settings
              </NavLink>
            </nav>
          </div>
        </div>
        <div className="bg-warn-soft border-t border-warn-500/30">
          <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 text-xs text-warn-soft-ink text-center">
            Research prototype — not a medical device. Not for diagnosis or
            clinical use.{" "}
            <NavLink to="/about" className="underline font-medium">
              Read the full disclaimer
            </NavLink>
            .
          </p>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-clinic-200 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-xs text-clinic-500 flex flex-col sm:flex-row gap-2 sm:justify-between">
          <span>RetinaAI — educational &amp; research prototype.</span>
          <span>All analysis data stays on this device.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
