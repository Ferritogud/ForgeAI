"use client";

import { MouseEvent, useEffect, useRef, useState } from "react";
import { MockUser, Project, Tier } from "@/lib/types";
import { TIER_INFO } from "@/lib/tiers";
import { SIDEBAR_MAX_WIDTH, SIDEBAR_MIN_WIDTH } from "@/lib/storage";
import { EarnedBadge } from "@/lib/badges";
import RadialGauge from "./RadialGauge";
import ProjectMenu from "./ProjectMenu";
import ProjectIconButton from "./ProjectIconButton";
import AccountMenu from "./AccountMenu";

function projectPercent(project: Project): number {
  const tasks = project.milestones.flatMap((m) => m.tasks);
  if (tasks.length === 0) return 0;
  return (tasks.filter((t) => t.completed).length / tasks.length) * 100;
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}
function KebabIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
      <circle cx="8" cy="3" r="1.3" />
      <circle cx="8" cy="8" r="1.3" />
      <circle cx="8" cy="13" r="1.3" />
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
function ChevronUpDownIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-ink-faint shrink-0" fill="none">
      <path
        d="M4.5 6.5 8 3l3.5 3.5M4.5 9.5 8 13l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ActivityIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <rect x="1.5" y="1.5" width="3" height="3" rx="0.6" fill="currentColor" />
      <rect x="6.5" y="1.5" width="3" height="3" rx="0.6" fill="currentColor" opacity="0.4" />
      <rect x="11.5" y="1.5" width="3" height="3" rx="0.6" fill="currentColor" opacity="0.7" />
      <rect x="1.5" y="6.5" width="3" height="3" rx="0.6" fill="currentColor" opacity="0.7" />
      <rect x="6.5" y="6.5" width="3" height="3" rx="0.6" fill="currentColor" />
      <rect x="11.5" y="6.5" width="3" height="3" rx="0.6" fill="currentColor" opacity="0.4" />
      <rect x="1.5" y="11.5" width="3" height="3" rx="0.6" fill="currentColor" opacity="0.4" />
      <rect x="6.5" y="11.5" width="3" height="3" rx="0.6" fill="currentColor" opacity="0.7" />
      <rect x="11.5" y="11.5" width="3" height="3" rx="0.6" fill="currentColor" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path
        d="M5 2.5h6v3.8a3 3 0 0 1-6 0V2.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M5 3.3H3a1.5 1.5 0 0 0 1.5 1.5M11 3.3h2a1.5 1.5 0 0 1-1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 9.8v2M6 13.5h4M6.3 13.5c0-1.2.6-1.7 1.7-1.7s1.7.5 1.7 1.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CalendarWeekIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <rect x="2" y="3.5" width="12" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.8 9.5h6.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  width: number;
  onWidthChange: (width: number) => void;
  onResizingChange?: (resizing: boolean) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onSetIcon: (id: string, icon: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenSettings: () => void;
  onOpenActivity: () => void;
  onOpenBadges: () => void;
  onOpenDigest: () => void;
  user: MockUser;
  tier: Tier;
  earnedBadges: EarnedBadge[];
  onSignOut: () => void;
}

export default function Sidebar({
  projects,
  activeProjectId,
  collapsed,
  onToggleCollapsed,
  width,
  onWidthChange,
  onResizingChange,
  onSelect,
  onNew,
  onRename,
  onDelete,
  onSetIcon,
  mobileOpen,
  onCloseMobile,
  onOpenSettings,
  onOpenActivity,
  onOpenBadges,
  onOpenDigest,
  user,
  tier,
  earnedBadges,
  onSignOut,
}: SidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [menuProjectId, setMenuProjectId] = useState<string | null>(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null);

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountAnchorRect, setAccountAnchorRect] = useState<DOMRect | null>(null);
  const accountBtnRef = useRef<HTMLButtonElement>(null);

  const openAccountMenu = () => {
    if (accountBtnRef.current) setAccountAnchorRect(accountBtnRef.current.getBoundingClientRect());
    setAccountMenuOpen(true);
  };

  const initial = user.name.trim().charAt(0).toUpperCase() || "?";
  const tierLabel = TIER_INFO[tier].label;

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

  const openMenu = (e: MouseEvent<HTMLButtonElement>, projectId: string) => {
    e.stopPropagation();
    setMenuAnchorRect(e.currentTarget.getBoundingClientRect());
    setMenuProjectId(projectId);
  };

  const menuProject = projects.find((p) => p.id === menuProjectId) ?? null;

  // Live width while actively dragging the resize handle — kept separate
  // from the persisted `width` prop so every mousemove doesn't hit
  // localStorage; only the final value on mouseup gets committed via
  // onWidthChange.
  const [liveWidth, setLiveWidth] = useState<number | null>(null);
  const displayWidth = liveWidth ?? width;

  useEffect(() => {
    if (liveWidth === null) return;
    const prevCursor = document.body.style.cursor;
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    onResizingChange?.(true);

    const onMouseMove = (e: globalThis.MouseEvent) => {
      const next = Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, e.clientX));
      setLiveWidth(next);
    };
    const onMouseUp = () => {
      setLiveWidth((current) => {
        if (current !== null) onWidthChange(current);
        return null;
      });
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevUserSelect;
      onResizingChange?.(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveWidth]);

  const startResize = (e: MouseEvent<HTMLDivElement>) => {
    if (collapsed) return;
    e.preventDefault();
    setLiveWidth(width);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        style={!collapsed ? { width: `${displayWidth}px` } : undefined}
        className={`fixed left-0 top-0 z-50 h-screen flex flex-col border-r border-line bg-card md:translate-x-0 w-72
          ${liveWidth === null ? "transition-[transform,width] duration-300" : ""}
          ${collapsed ? "md:w-[76px]" : "md:w-auto"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {!collapsed && (
          <div
            onMouseDown={startResize}
            className="hidden md:block absolute top-0 right-0 h-full w-1.5 -mr-0.5 cursor-col-resize z-10 hover:bg-accent/40 active:bg-accent/60 transition-colors"
          />
        )}
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-5 pb-3 shrink-0">
            <div className={`flex items-center gap-2 overflow-hidden ${collapsed ? "md:hidden" : ""}`}>
              <span className="inline-flex h-2 w-2 rounded-full bg-accent shrink-0" />
              <span className="text-sm font-semibold text-ink-primary whitespace-nowrap">
                Forge<span className="text-accent">AI</span>
              </span>
            </div>
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-ink-secondary hover:text-accent"
              aria-label="Close menu"
            >
              <CloseIcon />
            </button>
            <button
              onClick={onToggleCollapsed}
              className="hidden md:flex p-1.5 rounded-lg text-ink-secondary hover:text-accent hover:bg-accent-soft transition-colors"
              aria-label="Toggle sidebar"
            >
              <ChevronIcon open={!collapsed} />
            </button>
          </div>

          {/* New project */}
          <div className="px-3 pb-3 shrink-0">
            <button
              onClick={onNew}
              className={`w-full flex items-center gap-2.5 rounded-xl border border-accent/40 text-accent text-sm font-medium
                hover:border-accent hover:bg-accent-soft transition-colors duration-200
                ${collapsed ? "md:justify-center md:px-0" : "px-3.5"} py-3`}
            >
              <PlusIcon />
              <span className={collapsed ? "md:hidden" : ""}>New Project</span>
            </button>
          </div>

          {/* Activity / Badges / This Week */}
          <div className="px-3 pb-3 shrink-0 flex flex-col gap-0.5">
            <button
              onClick={onOpenActivity}
              className={`w-full flex items-center gap-2.5 rounded-xl text-ink-secondary text-sm
                hover:text-ink-primary hover:bg-card-muted transition-colors duration-200
                ${collapsed ? "md:justify-center md:px-0" : "px-3.5"} py-2`}
            >
              <ActivityIcon />
              <span className={collapsed ? "md:hidden" : ""}>Activity</span>
            </button>
            <button
              onClick={onOpenBadges}
              className={`w-full flex items-center gap-2.5 rounded-xl text-ink-secondary text-sm
                hover:text-ink-primary hover:bg-card-muted transition-colors duration-200
                ${collapsed ? "md:justify-center md:px-0" : "px-3.5"} py-2`}
            >
              <TrophyIcon />
              <span className={collapsed ? "md:hidden" : ""}>Badges</span>
            </button>
            <button
              onClick={onOpenDigest}
              className={`w-full flex items-center gap-2.5 rounded-xl text-ink-secondary text-sm
                hover:text-ink-primary hover:bg-card-muted transition-colors duration-200
                ${collapsed ? "md:justify-center md:px-0" : "px-3.5"} py-2`}
            >
              <CalendarWeekIcon />
              <span className={collapsed ? "md:hidden" : ""}>This Week</span>
            </button>
          </div>

          <div className="divider shrink-0" />

          {/* Project list */}
          <nav data-tour="sidebar" className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-1">
            {projects.length === 0 && (
              <p className={`eyebrow px-2.5 py-4 text-center ${collapsed ? "md:hidden" : ""}`}>
                No missions yet
              </p>
            )}
            {projects.map((project) => {
              const active = project.id === activeProjectId;
              const percent = projectPercent(project);
              const isRenaming = renamingId === project.id;
              const isMenuOpen = menuProjectId === project.id;

              return (
                <div
                  key={project.id}
                  className={`group relative flex items-center gap-2 rounded-xl border-l-2 pl-2.5 transition-colors duration-200 ${
                    active
                      ? "bg-accent-soft border-l-accent"
                      : "border-l-transparent hover:bg-card-muted"
                  }`}
                >
                  <span className={`shrink-0 ${collapsed ? "md:hidden" : ""}`}>
                    <ProjectIconButton icon={project.icon} onSelect={(icon) => onSetIcon(project.id, icon)} />
                  </span>

                  <button
                    onClick={() => onSelect(project.id)}
                    className={`flex-1 min-w-0 flex items-center gap-2 py-2.5 pr-2.5 text-left ${
                      collapsed ? "md:justify-center" : ""
                    }`}
                    title={project.name}
                  >
                    <RadialGauge percent={percent} size={26} strokeWidth={2.5} className="shrink-0">
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
                          className="w-full bg-card-muted border border-accent/50 rounded px-1.5 py-0.5 text-sm text-ink-primary focus:outline-none"
                        />
                      ) : (
                        <p
                          className={`text-sm truncate pr-5 ${
                            active ? "text-ink-primary font-medium" : "text-ink-secondary"
                          }`}
                        >
                          {project.name}
                        </p>
                      )}
                    </div>
                  </button>

                  {!collapsed && !isRenaming && (
                    <button
                      onClick={(e) => openMenu(e, project.id)}
                      className={`absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-ink-faint hover:text-accent hover:bg-accent-soft transition-opacity duration-150
                        opacity-100 md:opacity-0 md:group-hover:opacity-100
                        ${isMenuOpen ? "md:opacity-100" : ""}
                      `}
                      aria-label="Project options"
                    >
                      <KebabIcon />
                    </button>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="divider shrink-0" />

          {/* Footer / account */}
          <div className="px-3 py-3 shrink-0">
            <button
              ref={accountBtnRef}
              onClick={openAccountMenu}
              className={`w-full flex items-center gap-2.5 rounded-full bg-card-muted hover:bg-line/60 transition-colors duration-200
                ${collapsed ? "md:justify-center md:px-0 md:py-2" : "px-2.5"} py-2`}
            >
              <span className="shrink-0 h-7 w-7 rounded-full bg-accent text-white text-xs font-semibold flex items-center justify-center">
                {initial}
              </span>
              <span className={`min-w-0 flex-1 text-left ${collapsed ? "md:hidden" : ""}`}>
                <span className="block text-sm font-medium text-ink-primary truncate">{user.name}</span>
                <span className="flex items-center gap-1 text-xs text-ink-secondary truncate">
                  {tierLabel}
                  {earnedBadges.length > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-ink-faint">
                      · <span aria-hidden="true">🏆</span>
                      {earnedBadges.length}
                    </span>
                  )}
                </span>
              </span>
              <span className={collapsed ? "md:hidden" : ""}>
                <ChevronUpDownIcon />
              </span>
            </button>
          </div>
        </div>
      </aside>

      {menuProject && menuAnchorRect && (
        <ProjectMenu
          anchorRect={menuAnchorRect}
          projectName={menuProject.name}
          onRename={() => startRename(menuProject)}
          onDelete={() => onDelete(menuProject.id)}
          onClose={() => setMenuProjectId(null)}
        />
      )}

      {accountMenuOpen && accountAnchorRect && (
        <AccountMenu
          anchorRect={accountAnchorRect}
          email={user.email}
          earnedBadges={earnedBadges}
          onOpenSettings={onOpenSettings}
          onOpenBadges={onOpenBadges}
          onSignOut={onSignOut}
          onClose={() => setAccountMenuOpen(false)}
        />
      )}
    </>
  );
}
