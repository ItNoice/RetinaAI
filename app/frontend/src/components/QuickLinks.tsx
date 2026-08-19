import { Link } from "react-router-dom";
import type { ReactNode } from "react";

interface QuickLink {
  to: string;
  title: string;
  description: string;
  icon: ReactNode;
}

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  "aria-hidden": true,
  className: "w-4 h-4",
} as const;

const LINKS: QuickLink[] = [
  {
    to: "/history",
    title: "History",
    description: "All past scans in one table",
    icon: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    to: "/compare",
    title: "Compare",
    description: "View several scans side by side",
    icon: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 4v16M16 4v16M4 9h4m8 0h4M4 15h4m8 0h4"
        />
      </svg>
    ),
  },
  {
    to: "/research",
    title: "Research",
    description: "Real accuracy, metrics & confusion matrix",
    icon: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3v18h18M8 17V10m5 7V6m5 11v-4"
        />
      </svg>
    ),
  },
  {
    to: "/experiments",
    title: "Experiments",
    description: "The real per-epoch training run",
    icon: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 3h6M10 3v5.5L5.5 17a2 2 0 001.8 3h9.4a2 2 0 001.8-3L14 8.5V3"
        />
      </svg>
    ),
  },
  {
    to: "/methods",
    title: "Methods",
    description: "The pipeline, model & evaluation approach",
    icon: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 4.5a8.38 8.38 0 013 6.5c0 4.5-3 7.5-3 7.5s-3-3-3-7.5a8.38 8.38 0 013-6.5z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.5v.01" />
      </svg>
    ),
  },
  {
    to: "/ethics",
    title: "Ethics",
    description: "Language, consent & honesty principles",
    icon: (
      <svg {...ICON_PROPS}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        />
      </svg>
    ),
  },
  {
    to: "/about",
    title: "About & Safety",
    description: "Disclaimers, limitations, privacy",
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
  {
    to: "/settings",
    title: "Settings",
    description: "Theme & preferences",
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
  },
];

export default function QuickLinks() {
  return (
    <nav aria-label="Other sections" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="group flex items-start gap-2.5 rounded-lg border border-clinic-200 bg-surface px-3.5 py-3 hover:border-accent-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
        >
          <span className="text-clinic-400 group-hover:text-accent-600 transition-colors mt-0.5 shrink-0">
            {link.icon}
          </span>
          <span>
            <span className="block text-sm font-medium text-clinic-900">
              {link.title}
            </span>
            <span className="block text-xs text-clinic-500 leading-snug mt-0.5">
              {link.description}
            </span>
          </span>
        </Link>
      ))}
    </nav>
  );
}
