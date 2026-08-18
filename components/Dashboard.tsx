"use client";

import { Project } from "@/lib/types";
import ProgressBar from "./ProgressBar";
import MilestoneCard from "./MilestoneCard";
import ProjectionsPanel from "./ProjectionsPanel";

interface DashboardProps {
  project: Project;
  onToggleTask: (projectId: string, milestoneIndex: number, taskIndex: number) => void;
}

export default function Dashboard({ project, onToggleTask }: DashboardProps) {
  const allTasks = project.milestones.flatMap((m) => m.tasks);
  const doneCount = allTasks.filter((t) => t.done).length;
  const percent = allTasks.length > 0 ? (doneCount / allTasks.length) * 100 : 0;

  return (
    <main key={project.id} className="min-h-screen px-6 sm:px-10 py-12 sm:py-16">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <header className="flex flex-col gap-8 animate-fade-up">
          <div>
            <p className="hud-label text-blue-glow mb-3 tracking-[0.22em]">Active Mission</p>
            <h1 className="text-3xl sm:text-[2.75rem] font-bold text-ink-primary max-w-3xl leading-[1.1] tracking-tight text-balance">
              {project.goal}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-stretch">
            <ProgressBar percent={percent} />
            <ProjectionsPanel project={project} percent={percent} />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 items-start">
          {project.milestones.map((milestone, i) => (
            <MilestoneCard
              key={i}
              milestone={milestone}
              index={i}
              total={project.milestones.length}
              onToggleTask={(taskIndex) => onToggleTask(project.id, i, taskIndex)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
