import { Link, useLocation } from "react-router-dom";

// Dynamic segments (just analysis/:id) get a fixed label rather than the raw
// id — this only needs to orient the reader, not title the page.
const SEGMENT_LABELS: Record<string, string> = {
  analyze: "Analyze",
  history: "History",
  compare: "Compare",
  research: "Research",
  experiments: "Experiments",
  knowledge: "Knowledge",
  "model-lab": "Model Lab",
  methods: "Methods",
  ethics: "Ethics",
  about: "About & Safety",
  settings: "Settings",
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const [firstSegment] = pathname.split("/").filter(Boolean);

  const crumbs: { label: string; to: string }[] = [{ label: "Overview", to: "/" }];
  if (firstSegment === "analysis") {
    // /analysis/:id — the id itself isn't a meaningful breadcrumb label.
    crumbs.push({ label: "Analyze", to: "/analyze" }, { label: "Result", to: pathname });
  } else if (firstSegment && SEGMENT_LABELS[firstSegment]) {
    crumbs.push({ label: SEGMENT_LABELS[firstSegment], to: `/${firstSegment}` });
  }

  if (crumbs.length === 1) {
    return (
      <span className="text-sm font-medium text-chrome-200">{crumbs[0].label}</span>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.to} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && (
              <span className="text-chrome-300/50" aria-hidden="true">
                /
              </span>
            )}
            {isLast ? (
              <span className="font-medium text-white truncate">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.to}
                className="text-chrome-300 hover:text-white transition-colors truncate rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
