import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { usePreferences } from "../hooks/usePreferences";
import { useModelStatus } from "../hooks/useStatus";
import { Icon, StatusDot, type IconName } from "./ui";

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** Tooltip and assistive text — the labels alone are terse. */
  hint?: string;
}

// Shallow on purpose. Fourteen routes listed flat made the workspace look like
// one item in a docs site; Research and Reference are still one click away.
const WORKSPACE_ITEMS: NavItem[] = [
  { to: "/", label: "Overview", icon: "overview", hint: "Workflow and recent activity" },
  { to: "/analyze", label: "Analyze", icon: "scan", hint: "Load a fundus image and run the model" },
  { to: "/history", label: "History", icon: "history", hint: "Previously analyzed images" },
  { to: "/compare", label: "Compare", icon: "compare", hint: "View analyses side by side" },
];

const RESEARCH_ITEMS: NavItem[] = [
  { to: "/research", label: "Evaluation", icon: "research", hint: "Held-out accuracy, F1, confusion matrix" },
  { to: "/experiments", label: "Training", icon: "experiments", hint: "Per-epoch training log" },
  { to: "/model-lab", label: "Model", icon: "model", hint: "Checkpoint and dataset provenance" },
];

const REFERENCE_ITEMS: NavItem[] = [
  { to: "/knowledge", label: "Knowledge", icon: "knowledge", hint: "Retinal anatomy and DR grading" },
  { to: "/methods", label: "Methods", icon: "methods", hint: "How the pipeline works" },
  { to: "/ethics", label: "Ethics", icon: "ethics", hint: "Research-integrity principles" },
  { to: "/about", label: "About & Safety", icon: "about", hint: "What this tool is and isn't for" },
];

function linkClass({ isActive }: { isActive: boolean }) {
  return [
    "group relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-offset-1 focus-visible:ring-offset-chrome-900",
    isActive
      ? "bg-chrome-700/70 text-white font-medium"
      : "text-chrome-300 hover:text-white hover:bg-chrome-700/40",
  ].join(" ");
}

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={linkClass}
      onClick={onNavigate}
      title={item.hint}
    >
      {({ isActive }) => (
        <>
          {/* Shape cue as well as colour for the active row. */}
          <span
            aria-hidden="true"
            className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full transition-colors ${
              isActive ? "bg-accent-500" : "bg-transparent"
            }`}
          />
          <Icon name={item.icon} className="w-[18px] h-[18px]" />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function NavGroup({
  label,
  items,
  onNavigate,
  defaultOpen,
}: {
  label: string;
  items: NavItem[];
  onNavigate: () => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-semibold uppercase tracking-[0.08em] text-chrome-300/60 hover:text-chrome-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <Icon
          name="chevron-right"
          className={`w-3 h-3 transition-transform duration-150 ${open ? "rotate-90" : ""}`}
        />
        {label}
      </button>
      {open && (
        <div className="mt-0.5 space-y-0.5">
          {items.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { preferences } = usePreferences();
  const { status, backendReachable } = useModelStatus();

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, onClose]);

  const modelReady = backendReachable && status.available;

  const content = (
    <div className="relative flex h-full w-56 flex-col bg-chrome-900 border-r border-chrome-700">
      <NavLink
        to="/"
        className="flex items-center gap-2.5 px-4 h-12 shrink-0 border-b border-chrome-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 focus-visible:ring-inset"
        onClick={onClose}
      >
        <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
          <path
            d="M2 16c4-7 8.5-10.5 14-10.5S26 9 30 16c-4 7-8.5 10.5-14 10.5S6 23 2 16z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            className="text-accent-500"
          />
          <circle cx="16" cy="16" r="4.75" className="fill-accent-500" />
          <circle cx="16" cy="16" r="1.5" className="fill-chrome-900" />
        </svg>
        <span className="text-white font-semibold tracking-tight text-[15px]">
          Retina<span className="text-accent-400">AI</span>
        </span>
      </NavLink>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close navigation"
        className="lg:hidden absolute top-2.5 right-2.5 p-1.5 rounded-md text-chrome-300 hover:text-white hover:bg-chrome-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <Icon name="close" className="w-4 h-4" />
      </button>

      <nav
        aria-label="Primary"
        className="flex-1 overflow-y-auto panel-scroll px-3 py-3 space-y-4"
      >
        <div className="space-y-0.5">
          {WORKSPACE_ITEMS.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onClose} />
          ))}
        </div>

        {preferences.researchMode && (
          <NavGroup
            label="Research"
            items={RESEARCH_ITEMS}
            onNavigate={onClose}
            defaultOpen
          />
        )}

        <NavGroup
          label="Reference"
          items={REFERENCE_ITEMS}
          onNavigate={onClose}
          defaultOpen={false}
        />
      </nav>

      <div className="shrink-0 border-t border-chrome-700 p-3 space-y-0.5">
        <NavLink
          to="/settings"
          className={linkClass}
          onClick={onClose}
          title="Preferences, stored in this browser"
        >
          <Icon name="settings" className="w-[18px] h-[18px]" />
          <span>Settings</span>
        </NavLink>
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-chrome-300"
          title={status.note}
        >
          <StatusDot tone={modelReady ? "ok" : "neutral"} pulse={modelReady} />
          <span className="truncate">{modelReady ? "Model ready" : "Model unavailable"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: always-visible rail */}
      <div className="hidden lg:block shrink-0">{content}</div>

      {/* Mobile: overlay drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" aria-hidden="true" onClick={onClose} />
          <div className="relative">{content}</div>
        </div>
      )}
    </>
  );
}
