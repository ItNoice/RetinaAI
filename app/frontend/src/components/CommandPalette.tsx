import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useCommandPalette } from "../hooks/useCommandPalette";
import { usePreferences } from "../hooks/usePreferences";
import { useTheme } from "../hooks/useTheme";

interface Command {
  id: string;
  label: string;
  group: string;
  keywords?: string;
  action: () => void;
}

export default function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const navigate = useNavigate();
  const { preferences, setPreference } = usePreferences();
  const { setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const go = (path: string) => () => navigate(path);

  const commands: Command[] = useMemo(
    () => [
      { id: "nav-overview", label: "Open Overview", group: "Navigate", action: go("/") },
      { id: "nav-analyze", label: "Analyze image", group: "Navigate", keywords: "upload", action: go("/analyze") },
      { id: "nav-history", label: "Open History", group: "Navigate", action: go("/history") },
      { id: "nav-compare", label: "Compare images", group: "Navigate", action: go("/compare") },
      { id: "nav-research", label: "Open Research", group: "Navigate", action: go("/research") },
      { id: "nav-experiments", label: "Open Experiments", group: "Navigate", action: go("/experiments") },
      { id: "nav-knowledge", label: "Open Knowledge", group: "Navigate", action: go("/knowledge") },
      { id: "nav-model-lab", label: "Open Model Lab", group: "Navigate", action: go("/model-lab") },
      { id: "nav-settings", label: "Open Settings", group: "Navigate", action: go("/settings") },
      {
        id: "toggle-research-mode",
        label: preferences.researchMode ? "Turn off Research Mode" : "Turn on Research Mode",
        group: "Actions",
        action: () => setPreference("researchMode", !preferences.researchMode),
      },
      { id: "theme-light", label: "Change theme: Light", group: "Actions", keywords: "appearance", action: () => setTheme("light") },
      { id: "theme-dark", label: "Change theme: Dark", group: "Actions", keywords: "appearance", action: () => setTheme("dark") },
      { id: "theme-system", label: "Change theme: System", group: "Actions", keywords: "appearance", action: () => setTheme("system") },
    ],
    [preferences.researchMode, setPreference, setTheme],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.keywords ?? ""}`.toLowerCase().includes(q),
    );
  }, [commands, query]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const run = (command: Command | undefined) => {
    if (!command) return;
    command.action();
    close();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-lg rounded-lg border border-chrome-700 bg-chrome-900 shadow-2xl overflow-hidden"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            close();
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            run(filtered[activeIndex]);
          }
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command…"
          aria-label="Search commands"
          className="w-full bg-transparent px-4 py-3.5 text-sm text-white placeholder:text-chrome-300 border-b border-chrome-700 focus:outline-none"
        />
        <div className="max-h-80 overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-sm text-chrome-300 text-center">No matching commands.</p>
          ) : (
            filtered.map((command, i) => (
              <button
                key={command.id}
                type="button"
                onClick={() => run(command)}
                onMouseEnter={() => setActiveIndex(i)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-sm text-left transition-colors ${
                  i === activeIndex ? "bg-accent-600 text-white" : "text-chrome-200"
                }`}
              >
                <span>{command.label}</span>
                <span className={`text-[11px] ${i === activeIndex ? "text-white/70" : "text-chrome-300"}`}>
                  {command.group}
                </span>
              </button>
            ))
          )}
        </div>
        <div className="border-t border-chrome-700 px-4 py-2 text-[11px] text-chrome-300 flex items-center gap-3">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
