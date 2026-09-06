"use client";

import { Project } from "@/lib/types";
import { computeProjection, Trend } from "@/lib/projections";
import GlassCard from "./GlassCard";
import RadialGauge from "./RadialGauge";

interface ProjectionsPanelProps {
  project: Project;
  percent: number;
  now?: Date;
}

function TrendArrow({ trend }: { trend: Trend }) {
  if (trend === "ahead" || trend === "complete") {
    return (
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M4 12 12 4M12 4H6M12 4v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (trend === "behind") {
    return (
      <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
        <path d="M4 4l8 8M12 12H6M12 12V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function ProjectionsPanel({ project, percent, now }: ProjectionsPanelProps) {
  const { trend, label } = computeProjection(project, percent, now);

  const trendConfig: Record<Trend, { text: string; className: string; strokeColor: string }> = {
    ahead: { text: "Ahead of pace", className: "text-momentum", strokeColor: "var(--momentum)" },
    "on-track": { text: "On track", className: "text-momentum", strokeColor: "var(--momentum)" },
    behind: { text: "Behind pace", className: "text-warn", strokeColor: "var(--warn)" },
    complete: { text: "Complete", className: "text-success", strokeColor: "var(--success)" },
    unknown: { text: "Awaiting data", className: "text-ink-faint", strokeColor: "var(--accent)" },
  };
  const cfg = trendConfig[trend];

  return (
    <GlassCard className="rounded-xl px-3 py-2 flex items-center gap-2.5 min-w-[170px]">
      <RadialGauge percent={percent} size={36} strokeWidth={3.5} strokeColor={cfg.strokeColor}>
        <span className="font-mono text-[0.6rem] text-ink-primary">{Math.round(percent)}%</span>
      </RadialGauge>

      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="eyebrow text-[0.6rem]">Projection</span>
        <span className="font-mono text-xs text-ink-primary truncate">{label}</span>
        <div className={`flex items-center gap-1 text-[0.7rem] font-medium ${cfg.className}`}>
          <TrendArrow trend={trend} />
          <span>{cfg.text}</span>
        </div>
      </div>
    </GlassCard>
  );
}
