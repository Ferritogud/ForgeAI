"use client";

import { useEffect, useRef, useState } from "react";
import { Project } from "@/lib/types";
import RadialGauge from "./RadialGauge";

function projectPercent(project: Project): number {
  const tasks = project.milestones.flatMap((m) => m.tasks);
  if (tasks.length === 0) return 0;
  return (tasks.filter((t) => t.done).length / tasks.length) * 100;
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path
        d="M11.3 2.3a1.5 1.5 0 0 1 2.1 2.1L5.6 12.2l-2.9.8.8-2.9 7.8-7.8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path
        d="M3 4.5h10M6.5 4.5v-1a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M6 7.5v4M10 7.5v4M4 4.5l.6 8a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`w-4 h-4 transition-transform duration-300 ${open ? "" : "rotate-180"}`}
      fill="none"
    >
      <path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({
  projects,
  activeProjectId,
  collapsed,
  onToggleCollapsed,
  onSelect,
  onNew,
  onRename,
  onDelete,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.select();
  }, [renamingId]);

  const startRename = (p: Project) => {
    setRenamingId(p.id);
    setRenameValue(p.name);
  };

  const commitRename = () => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  };

  const handleDelete = (p: Project) => {
    if (window.confirm(`Delete "${p.name}"? This can't be undone.`)) {
      onDelete(p.id);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-base-deep/70 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen flex flex-col border-r border-blue-dim/30 bg-[#111124]/95 backdrop-blur-xl transition-[transform,width] duration-300 md:translate-x-0 w-72
          ${collapsed ? "md:w-[76px]" : "md:w-[272px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
            <div className={`flex items-center gap-2 overflow-hidden ${collapsed ? "md:hidden" : ""}`}>
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full rounded-full bg-blue-glow animate-pulse-glow" />
              </span>
              <span className="font-mono text-xs tracking-[0.2em] text-ink-secondary uppercase whitespace-nowrap">
                Forge<span className="text-blue-glow">AI</span>
              </span>
            </div>
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-ink-secondary hover:text-blue-glow"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
            <button
              onClick={onToggleCollapsed}
              className="hidden md:flex p-1.5 rounded-lg text-ink-secondary hover:text-blue-glow hover:bg-blue-glow/5 transition-colors"
              aria-label="Toggle sidebar"
            >
              <ChevronIcon open={!collapsed} />
            </button>
          </div>

          {/* New project */}
          <div className="px-3 pb-3 shrink-0">
            <button
              onClick={onNew}
              className={`w-full flex items-center gap-2.5 rounded-xl border border-blue-glow/25 text-blue-glow font-mono text-xs uppercase tracking-widest
                hover:border-blue-glow/60 hover:bg-blue-glow/5 hover:shadow-glow-blue-sm transition-all duration-200
                ${collapsed ? "md:justify-center md:px-0" : "px-3.5"} py-3`}
            >
              <PlusIcon />
              <span className={collapsed ? "md:hidden" : ""}>New Project</span>
            </button>
          </div>

          <div className="hud-divider shrink-0" />

          {/* Project list */}
          <nav className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-1">
            {projects.length === 0 && (
              <p className={`hud-label text-ink-faint px-2.5 py-4 text-center ${collapsed ? "md:hidden" : ""}`}>
                No missions yet
              </p>
            )}
            {projects.map((project) => {
              const active = project.id === activeProjectId;
              const percent = projectPercent(project);
              const isRenaming = renamingId === project.id;

              return (
                <div
                  key={project.id}
                  className={`group relative rounded-xl border-l-2 transition-all duration-200 ${
                    active
                      ? "bg-blue-glow/10 border-l-blue-glow shadow-glow-blue-sm"
                      : "border-l-transparent hover:bg-white/[0.03]"
                  }`}
                >
                  <button
                    onClick={() => onSelect(project.id)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2.5 text-left ${
                      collapsed ? "md:justify-center" : ""
                    }`}
                    title={project.name}
                  >
                    <RadialGauge
                      percent={percent}
                      size={26}
                      strokeWidth={2.5}
                      className="shrink-0"
                    >
                      <span className="font-mono text-[8px] text-ink-secondary">{Math.round(percent)}</span>
                    </RadialGauge>

                    <div className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
                      {isRenaming ? (
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={commitRename}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename();
                            if (e.key === "Escape") setRenamingId(null);
                          }}
                          className="w-full bg-base-deep border border-blue-glow/40 rounded px-1.5 py-0.5 text-sm text-ink-primary focus:outline-none"
                        />
                      ) : (
                        <p
                          className={`text-sm truncate ${
                            active ? "text-ink-primary font-medium" : "text-ink-secondary"
                          }`}
                        >
                          {project.name}
                        </p>
                      )}
                    </div>
                  </button>

                  {!collapsed && !isRenaming && (
                    <div className="hidden md:group-hover:flex absolute right-1.5 top-1/2 -translate-y-1/2 items-center gap-0.5 bg-[#111124] rounded-lg pl-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(project);
                        }}
                        className="p-1.5 rounded-md text-ink-faint hover:text-blue-glow hover:bg-blue-glow/10"
                        aria-label="Rename"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project);
                        }}
                        className="p-1.5 rounded-md text-ink-faint hover:text-amber hover:bg-amber/10"
                        aria-label="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}

                  {/* Mobile always-visible actions */}
                  {!isRenaming && (
                    <div className={`md:hidden flex items-center gap-1 absolute right-1.5 top-1/2 -translate-y-1/2 ${collapsed ? "hidden" : ""}`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(project);
                        }}
                        className="p-1.5 rounded-md text-ink-faint"
                        aria-label="Rename"
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(project);
                        }}
                        className="p-1.5 rounded-md text-ink-faint"
                        aria-label="Delete"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
