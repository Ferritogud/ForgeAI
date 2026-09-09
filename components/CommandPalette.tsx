"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Project, ViewMode } from "@/lib/types";
import { searchProjects } from "@/lib/search";

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M11 11 14.5 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  icon?: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  viewMode: ViewMode;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onOpenSettings: () => void;
  onSetViewMode: (mode: ViewMode) => void;
  onNavigateToResult: (projectId: string, milestoneId: string) => void;
}

const VIEW_COMMANDS: { mode: ViewMode; label: string }[] = [
  { mode: "checklist", label: "Switch to Checklist view" },
  { mode: "board", label: "Switch to Board view" },
  { mode: "timeline", label: "Switch to Timeline view" },
];

export default function CommandPalette({
  open,
  onClose,
  projects,
  activeProjectId,
  viewMode,
  onSelectProject,
  onNewProject,
  onOpenSettings,
  onSetViewMode,
  onNavigateToResult,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const q = query.trim().toLowerCase();

  const sections = useMemo(() => {
    const commandItems: PaletteItem[] = [];

    if (!q || "new project".includes(q)) {
      commandItems.push({
        id: "cmd-new",
        label: "New project",
        sublabel: "Start a fresh execution plan",
        onSelect: onNewProject,
      });
    }
    if (!q || "settings".includes(q)) {
      commandItems.push({
        id: "cmd-settings",
        label: "Open Settings",
        sublabel: "General, Plan, Trash",
        onSelect: onOpenSettings,
      });
    }
    if (activeProject) {
      for (const v of VIEW_COMMANDS) {
        if (v.mode === viewMode) continue;
        if (!q || v.label.toLowerCase().includes(q) || v.mode.includes(q)) {
          commandItems.push({
            id: `cmd-view-${v.mode}`,
            label: v.label,
            sublabel: activeProject.name,
            onSelect: () => onSetViewMode(v.mode),
          });
        }
      }
    }

    const projectItems: PaletteItem[] = projects
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.goal.toLowerCase().includes(q))
      .map((p) => ({
        id: `proj-${p.id}`,
        label: p.name,
        sublabel: p.id === activeProjectId ? "Current project" : "Switch to this project",
        icon: p.icon ?? "🗂️",
        onSelect: () => onSelectProject(p.id),
      }));

    const searchItems: PaletteItem[] = q
      ? searchProjects(projects, q).map((r, i) => ({
          id: `search-${i}`,
          label: r.taskTitle ?? r.milestoneTitle,
          sublabel: r.taskTitle
            ? `Task in "${r.milestoneTitle}" milestone, in "${r.projectName}"`
            : `Milestone in "${r.projectName}"`,
          icon: projects.find((p) => p.id === r.projectId)?.icon ?? "🗂️",
          onSelect: () => onNavigateToResult(r.projectId, r.milestoneId),
        }))
      : [];

    return [
      { label: "Commands", items: commandItems },
      { label: "Projects", items: projectItems },
      { label: "Search results", items: searchItems },
    ].filter((s) => s.items.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, projects, activeProjectId, viewMode]);

  const flatItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  if (!open) return null;

  const runItem = (item: PaletteItem) => {
    item.onSelect();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-[400] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 top-[12vh] z-[401] mx-auto w-full max-w-lg px-4">
        <div
          className="card rounded-2xl shadow-lg overflow-hidden flex flex-col animate-fade-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-line">
            <span className="text-ink-faint shrink-0">
              <SearchIcon />
            </span>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSelectedIndex((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const item = flatItems[selectedIndex];
                  if (item) runItem(item);
                } else if (e.key === "Escape") {
                  onClose();
                }
              }}
              placeholder="Search projects, milestones, tasks, or run a command…"
              className="flex-1 min-w-0 bg-transparent text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none"
            />
            <kbd className="hidden sm:inline-block text-2xs font-mono text-ink-faint border border-line rounded-md px-1.5 py-0.5">
              ESC
            </kbd>
          </div>

          <div className="max-h-[50vh] overflow-y-auto p-2">
            {flatItems.length === 0 && (
              <p className="text-sm text-ink-faint text-center py-8">No matches.</p>
            )}
            {sections.map((section) => (
              <div key={section.label} className="flex flex-col gap-0.5 mb-2 last:mb-0">
                <span className="eyebrow px-2.5 py-1.5">{section.label}</span>
                {section.items.map((item) => {
                  const index = flatItems.indexOf(item);
                  const selected = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setSelectedIndex(index)}
                      onClick={() => runItem(item)}
                      className={`flex flex-col items-start gap-0.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                        selected ? "bg-accent-soft" : "hover:bg-card-muted"
                      }`}
                    >
                      <span
                        className={`flex items-center gap-2 text-sm truncate w-full ${
                          selected ? "text-accent font-medium" : "text-ink-primary"
                        }`}
                      >
                        {item.icon && <span className="shrink-0">{item.icon}</span>}
                        <span className="truncate">{item.label}</span>
                      </span>
                      {item.sublabel && (
                        <span className="text-xs text-ink-faint truncate w-full">{item.sublabel}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
