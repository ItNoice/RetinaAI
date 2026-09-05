// All 24×24, stroked at 1.5, inheriting currentColor — these were hand-written
// per use site before, with inconsistent viewBoxes and stroke modes. No icon
// library: the set is small and a dependency would ship far more.
export type IconName =
  | "overview"
  | "upload"
  | "history"
  | "compare"
  | "research"
  | "experiments"
  | "knowledge"
  | "settings"
  | "model"
  | "methods"
  | "ethics"
  | "about"
  | "menu"
  | "close"
  | "chevron-right"
  | "chevron-down"
  | "chevron-left"
  | "zoom-in"
  | "zoom-out"
  | "fit"
  | "reset"
  | "rotate"
  | "fullscreen"
  | "fullscreen-exit"
  | "layers"
  | "brightness"
  | "contrast"
  | "check"
  | "check-circle"
  | "alert"
  | "info"
  | "clock"
  | "image"
  | "trash"
  | "download"
  | "print"
  | "eye"
  | "scan"
  | "panel-right"
  | "spinner";

const PATHS: Record<IconName, React.ReactNode> = {
  overview: <path d="M3 10.5L12 3l9 7.5M5 9v10.5a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V9" />,
  upload: <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 8.25L12 3.75m0 0L7.5 8.25M12 3.75v13.5" />,
  history: <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  compare: <path d="M8 4v16M16 4v16M4 9h4m8 0h4M4 15h4m8 0h4" />,
  research: <path d="M3 20h18M6 16V9m4 7V5m4 11v-4m4 4V8" />,
  experiments: <path d="M9 3v6.5L4.6 17a2 2 0 001.7 3h11.4a2 2 0 001.7-3L15 9.5V3M8 3h8M8.5 13h7" />,
  knowledge: <path d="M12 6.5A4.5 4.5 0 007.5 4H4v13h3.5A4.5 4.5 0 0112 19.5m0-13A4.5 4.5 0 0116.5 4H20v13h-3.5A4.5 4.5 0 0012 19.5m0-13v13" />,
  settings: (
    <>
      <path d="M10.3 3.9a1.5 1.5 0 013.4 0l.2 1a1.5 1.5 0 002.1 1.1l.9-.4a1.5 1.5 0 011.9.7l.5.9a1.5 1.5 0 01-.4 1.9l-.8.6a1.5 1.5 0 000 2.4l.8.6a1.5 1.5 0 01.4 1.9l-.5.9a1.5 1.5 0 01-1.9.7l-.9-.4a1.5 1.5 0 00-2.1 1.1l-.2 1a1.5 1.5 0 01-3.4 0l-.2-1a1.5 1.5 0 00-2.1-1.1l-.9.4a1.5 1.5 0 01-1.9-.7l-.5-.9a1.5 1.5 0 01.4-1.9l.8-.6a1.5 1.5 0 000-2.4l-.8-.6a1.5 1.5 0 01-.4-1.9l.5-.9a1.5 1.5 0 011.9-.7l.9.4a1.5 1.5 0 002.1-1.1z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  model: <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18m8-13.5L12 12 4 7.5" />,
  methods: <path d="M9 3v3.6a2 2 0 01-.4 1.2L4 14m5-11h6M15 3v3.6a2 2 0 00.4 1.2L20 14M4 14a5 5 0 0016 0M4 14h16" />,
  ethics: <path d="M12 3v18M7 7l-3 6a3 3 0 006 0l-3-6zm10 0l-3 6a3 3 0 006 0l-3-6zM6 21h12M9 5h6" />,
  about: <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  "chevron-right": <path d="M9 5l7 7-7 7" />,
  "chevron-down": <path d="M5 9l7 7 7-7" />,
  "chevron-left": <path d="M15 5l-7 7 7 7" />,
  "zoom-in": <path d="M10.5 3a7.5 7.5 0 105.3 12.8L21 21M8 10.5h5M10.5 8v5" />,
  "zoom-out": <path d="M10.5 3a7.5 7.5 0 105.3 12.8L21 21M8 10.5h5" />,
  fit: <path d="M4 9V5a1 1 0 011-1h4M15 4h4a1 1 0 011 1v4M20 15v4a1 1 0 01-1 1h-4M9 20H5a1 1 0 01-1-1v-4" />,
  reset: <path d="M4 4v6h6M4.6 14a8 8 0 103-8.4L4 10" />,
  rotate: <path d="M20 4v6h-6M19.4 14a8 8 0 11-3-8.4L20 10" />,
  fullscreen: <path d="M4 9V5a1 1 0 011-1h4M15 4h4a1 1 0 011 1v4M20 15v4a1 1 0 01-1 1h-4M9 20H5a1 1 0 01-1-1v-4" />,
  "fullscreen-exit": <path d="M9 4v4a1 1 0 01-1 1H4M20 9h-4a1 1 0 01-1-1V4M15 20v-4a1 1 0 011-1h4M4 15h4a1 1 0 011 1v4" />,
  layers: <path d="M12 3l9 5-9 5-9-5 9-5zm9 9l-9 5-9-5m18 4l-9 5-9-5" />,
  brightness: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.5 1.5m11.2 11.2l1.5 1.5M19.1 4.9l-1.5 1.5M6.4 17.6l-1.5 1.5" />
    </>
  ),
  contrast: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 010 18z" fill="currentColor" stroke="none" />
    </>
  ),
  check: <path d="M4.5 12.75l6 6 9-13.5" />,
  "check-circle": <path d="M9 12.75l2.25 2.25 4.5-4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  alert: <path d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.355-12.75c.865-1.5 3.031-1.5 3.896 0l7.355 12.75zM12 17.25h.007v.008H12v-.008z" />,
  info: <path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />,
  clock: <path d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />,
  image: <path d="M3 16l5-5 4 4 3-3 6 6M3 5h18v14H3V5zm6 4.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />,
  trash: <path d="M4 7h16M10 11v6m4-6v6M5 7l1 13a1 1 0 001 1h10a1 1 0 001-1l1-13M9 7V4h6v3" />,
  download: <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />,
  print: <path d="M7 8V3h10v5M7 18H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2M7 14h10v7H7v-7z" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V6a2 2 0 012-2h2M16 4h2a2 2 0 012 2v2M20 16v2a2 2 0 01-2 2h-2M8 20H6a2 2 0 01-2-2v-2" />
      <circle cx="12" cy="12" r="3.25" />
    </>
  ),
  "panel-right": <path d="M4 5h16v14H4V5zm11 0v14" />,
  spinner: <path d="M12 3a9 9 0 019 9" strokeLinecap="round" />,
};

export function Icon({
  name,
  className = "w-4 h-4",
  strokeWidth = 1.5,
  title,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
  /** Supplying a title makes the icon meaningful to assistive tech. Leave it
   *  off for icons that sit beside their own text label. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  );
}
