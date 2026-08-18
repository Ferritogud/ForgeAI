"use client";

import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import Sidebar from "./Sidebar";
import InputScreen from "./InputScreen";
import GeneratingScreen from "./GeneratingScreen";
import Dashboard from "./Dashboard";

type Mode = "input" | "generating" | "dashboard";

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function AppShell() {
  const {
    ready,
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    createProject,
    deleteProject,
    renameProject,
    toggleTask,
  } = useProjects();

  const [mode, setMode] = useState<Mode>("dashboard");
  const [pendingGoal, setPendingGoal] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const effectiveMode: Mode = ready && projects.length === 0 && mode !== "generating" ? "input" : mode;

  const handleNewProject = () => {
    setMode("input");
    setMobileOpen(false);
  };

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setMode("dashboard");
    setMobileOpen(false);
  };

  const handleGenerate = async (goal: string) => {
    setPendingGoal(goal);
    setMode("generating");

    const minDelay = new Promise((resolve) => setTimeout(resolve, 1800));
    const fetchPromise = fetch("/api/generate-roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal }),
    }).then((res) => res.json());

    const [data] = await Promise.all([fetchPromise, minDelay]);
    createProject(goal, data.milestones);
    setMode("dashboard");
  };

  if (!ready) return null;

  const highlightedId = effectiveMode === "input" ? null : activeProjectId;
  const sidebarOffset = collapsed ? "md:ml-[76px]" : "md:ml-[272px]";

  return (
    <div className="min-h-screen">
      <Sidebar
        projects={projects}
        activeProjectId={highlightedId}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onSelect={handleSelectProject}
        onNew={handleNewProject}
        onRename={renameProject}
        onDelete={deleteProject}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`transition-[margin] duration-300 ${sidebarOffset}`}>
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-blue-dim/20 sticky top-0 z-30 bg-base/90 backdrop-blur-md">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-ink-secondary hover:text-blue-glow"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <span className="font-mono text-xs tracking-[0.2em] text-ink-secondary uppercase">
            Forge<span className="text-blue-glow">AI</span>
          </span>
          <span className="w-9" />
        </div>

        {effectiveMode === "input" && <InputScreen onSubmit={handleGenerate} />}
        {effectiveMode === "generating" && <GeneratingScreen goal={pendingGoal} />}
        {effectiveMode === "dashboard" && activeProject && (
          <Dashboard project={activeProject} onToggleTask={toggleTask} />
        )}
      </div>
    </div>
  );
}
