import { NavLink } from "react-router-dom";
import { usePreferences } from "../hooks/usePreferences";
import { useModelStatus } from "../hooks/useStatus";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  "aria-hidden": true,
  className: "w-[18px] h-[18px] shrink-0",
} as const;

const PRIMARY_ITEMS: NavItem[] = [
  {
    to: "/",
    label: "Overview",
    icon: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5L12 3l9 7.5M5 9v10.5a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V9" />
      </svg>
    ),
  },
  {
    to: "/analyze",
    label: "Analyze",
    icon: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 8.25L12 3.75m0 0L7.5 8.25M12 3.75v13.5" />
      </svg>
    ),
  },
  {
    to: "/history",
    label: "History",
    icon: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: "/compare",
    label: "Compare",
    icon: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 4v16M16 4v16M4 9h4m8 0h4M4 15h4m8 0h4" />
      </svg>
    ),
  },
];

const RESEARCH_ITEMS: NavItem[] = [
  {
    to: "/research",
    label: "Research",
    icon: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M8 17V10m5 7V6m5 11v-4" />
      </svg>
    ),
  },
  {
    to: "/experiments",
    label: "Experiments",
    icon: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6M10 3v5.5L5.5 17a2 2 0 001.8 3h9.4a2 2 0 001.8-3L14 8.5V3" />
      </svg>
    ),
  },
];

const KNOWLEDGE_ITEM: NavItem = {
  to: "/knowledge",
  label: "Knowledge",
  icon: (
    <svg {...ICON_PROPS}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5c-1.5-1.5-4-2-6.5-1.5v13c2.5-.5 5 0 6.5 1.5m0-13c1.5-1.5 4-2 6.5-1.5v13c-2.5-.5-5 0-6.5 1.5m0-13v13" />
    </svg>
  ),
};

const SETTINGS_ITEM: NavItem = {
  to: "/settings",
  label: "Settings",
  icon: (
    <svg {...ICON_PROPS}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const REFERENCE_ITEMS: NavItem[] = [
  {
    to: "/model-lab",
    label: "Model Lab",
    icon: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v5.379a1 1 0 01-.293.707l-4.414 4.414A2 2 0 005.707 17h12.586a2 2 0 001.414-3.5l-4.414-4.414A1 1 0 0115 8.379V3M8 3h8" />
      </svg>
    ),
  },
  {
    to: "/methods",
    label: "Methods",
    icon: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5a8.38 8.38 0 013 6.5c0 4.5-3 7.5-3 7.5s-3-3-3-7.5a8.38 8.38 0 013-6.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5v.01" />
      </svg>
    ),
  },
  {
    to: "/ethics",
    label: "Ethics",
    icon: (
      <svg {...ICON_PROPS}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      </svg>
    ),
  },
  {
    to: "/about",
    label: "About & Safety",
    icon: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        />
      </svg>
    ),
  },
];

function itemClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
    isActive
      ? "bg-accent-soft text-accent-soft-ink"
      : "text-chrome-300 hover:text-white hover:bg-chrome-700/60"
  }`;
}

function referenceItemClass({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
    isActive
      ? "bg-accent-soft text-accent-soft-ink"
      : "text-chrome-300/80 hover:text-white hover:bg-chrome-700/60"
  }`;
}

function SidebarLink({
  item,
  onNavigate,
  className,
}: {
  item: NavItem;
  onNavigate: () => void;
  className: (props: { isActive: boolean }) => string;
}) {
  return (
    <NavLink to={item.to} end={item.to === "/"} className={className} onClick={onNavigate}>
      {item.icon}
      <span>{item.label}</span>
    </NavLink>
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

  const modelReady = backendReachable && status.available;

  const content = (
    <div className="flex h-full w-64 flex-col bg-chrome-900 border-r border-chrome-700">
      <NavLink
        to="/"
        className="flex items-center gap-2.5 px-4 h-16 shrink-0 border-b border-chrome-700"
        onClick={onClose}
      >
        <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true" className="shrink-0">
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
        <span className="text-white font-semibold tracking-tight text-[15px]">
          Retina<span className="text-accent-400">AI</span>
        </span>
      </NavLink>

      <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        <div className="space-y-0.5">
          {PRIMARY_ITEMS.map((item) => (
            <SidebarLink key={item.to} item={item} onNavigate={onClose} className={itemClass} />
          ))}
          {preferences.researchMode &&
            RESEARCH_ITEMS.map((item) => (
              <SidebarLink key={item.to} item={item} onNavigate={onClose} className={itemClass} />
            ))}
          <SidebarLink item={KNOWLEDGE_ITEM} onNavigate={onClose} className={itemClass} />
          <SidebarLink item={SETTINGS_ITEM} onNavigate={onClose} className={itemClass} />
        </div>

        <div>
          <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wider text-chrome-300/60">
            Reference
          </p>
          <div className="space-y-0.5">
            {REFERENCE_ITEMS.filter(
              (item) => preferences.researchMode || item.to !== "/model-lab",
            ).map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                onNavigate={onClose}
                className={referenceItemClass}
              />
            ))}
          </div>
        </div>
      </nav>

      <div className="shrink-0 border-t border-chrome-700 px-4 py-3">
        <span
          className="inline-flex items-center gap-2 text-xs font-medium text-chrome-300"
          title={status.note}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${modelReady ? "bg-ok-500" : "bg-clinic-400"}`}
            aria-hidden="true"
          />
          {modelReady ? "Model Ready" : "Model Unavailable"}
        </span>
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
          <div
            className="fixed inset-0 bg-black/50"
            aria-hidden="true"
            onClick={onClose}
          />
          <div className="relative">{content}</div>
        </div>
      )}
    </>
  );
}
