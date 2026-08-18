"use client";

import { Project } from "@/lib/types";
import GlassCard from "./GlassCard";
import RadialGauge from "./RadialGauge";

interface ProjectionsPanelProps {
  project: Project;
  percent: number;
}

type Trend = "ahead" | "on-track" | "behind" | "complete" | "unknown";

const DAY_MS = 24 * 60 * 60 * 1000;

function TrendArrow({ trend }: { trend: Trend }) {
  if (trend === "ahead" || trend === "complete") {
    return (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
        <path d="M4 12 12 4M12 4H6M12 4v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (trend === "behind") {
    return (
      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
        <path d="M4 4l8 8M12 12H6M12 12V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProjectionsPanel({ project, percent }: ProjectionsPanelProps) {
  const allTasks = project.milestones.flatMap((m) => m.tasks);
  const doneCount = allTasks.filter((t) => t.done).length;
  const total = allTasks.length;

  const created = new Date(project.createdAt).getTime();
  const now = Date.now();
  const daysElapsed = Math.max(1, (now - created) / DAY_MS);

  const plannedWeeks = Math.max(1, ...project.milestones.map((m) => m.dueWeek));
  const plannedCompletion = created + plannedWeeks * 7 * DAY_MS;

  let trend: Trend = "unknown";
  let projectedLabel = "Awaiting first task";

  if (percent >= 100) {
    trend = "complete";
    projectedLabel = "Mission complete";
  } else if (doneCount > 0) {
    const rate = doneCount / daysElapsed;
    const remaining = total - doneCount;
    const projectedDaysRemaining = remaining / rate;
    const projectedCompletion = now + projectedDaysRemaining * DAY_MS;
    const diff = projectedCompletion - plannedCompletion;

    if (diff < -3 * DAY_MS) trend = "ahead";
    else if (diff > 3 * DAY_MS) trend = "behind";
    else trend = "on-track";

    projectedLabel = new Date(projectedCompletion).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  const trendConfig: Record<Trend, { text: string; className: string }> = {
    ahead: { text: "Ahead of pace", className: "text-blue-glow" },
    "on-track": { text: "On track", className: "text-blue-core" },
    behind: { text: "Behind pace", className: "text-amber-bright" },
    complete: { text: "Complete", className: "text-blue-glow" },
    unknown: { text: "Awaiting data", className: "text-ink-faint" },
  };
  const cfg = trendConfig[trend];

  return (
    <GlassCard className="p-5 flex items-center gap-4 min-w-[240px]">
      <RadialGauge percent={percent} size={64} strokeWidth={5}>
        <span className="font-mono text-sm text-ink-primary">{Math.round(percent)}%</span>
      </RadialGauge>

      <div className="flex flex-col gap-1.5 min-w-0">
        <span className="hud-label text-ink-faint">Projection</span>
        <span className="font-mono text-sm text-ink-primary truncate">{projectedLabel}</span>
        <div className={`flex items-center gap-1.5 font-mono text-[0.68rem] uppercase tracking-widest ${cfg.className}`}>
          <TrendArrow trend={trend} />
          <span>{cfg.text}</span>
        </div>
      </div>
    </GlassCard>
  );
}
