import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

interface NavDropdownItem {
  to: string;
  label: string;
}

export default function NavDropdown({
  label,
  items,
}: {
  label: string;
  items: NavDropdownItem[];
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isActiveGroup = items.some(
    (item) =>
      location.pathname === item.to ||
      location.pathname.startsWith(`${item.to}/`),
  );

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
          isActiveGroup
            ? "bg-accent-soft text-accent-soft-ink"
            : "text-chrome-300 hover:text-white hover:bg-chrome-700/60"
        }`}
      >
        {label}
        <svg
          viewBox="0 0 12 12"
          className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 4.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute left-0 mt-1.5 w-48 rounded-md border border-clinic-200 bg-surface shadow-lg py-1 z-50"
        >
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              role="menuitem"
              className={({ isActive }) =>
                `block px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "text-accent-600 font-medium bg-accent-soft/40"
                    : "text-clinic-700 hover:bg-clinic-50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
