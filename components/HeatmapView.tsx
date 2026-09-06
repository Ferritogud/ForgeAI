"use client";

import { Project } from "@/lib/types";
import { buildHeatmap, intensityLevel } from "@/lib/heatmap";

// Inline opacity rather than Tailwind's bg-accent/NN modifier — the accent
// token is a plain CSS-variable string, which Tailwind can't alpha-composite
// at build time, so the opacity would silently be dropped.
const LEVEL_OPACITY: Record<0 | 1 | 2 | 3 | 4, number> = {
  0: 0,
  1: 0.3,
  2: 0.55,
  3: 0.8,
  4: 1,
};

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

interface HeatmapViewProps {
  project: Pick<Project, "milestones" | "createdAt">;
}

export default function HeatmapView({ project }: HeatmapViewProps) {
  const { weeks, monthLabels, maxCount } = buildHeatmap(project);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-[3px] overflow-x-auto pb-1">
        <div className="flex flex-col gap-[3px] pr-1 pt-[18px] shrink-0">
          {DAY_LABELS.map((label, i) => (
            <span key={i} className="h-[11px] text-[0.6rem] leading-[11px] text-ink-faint">
              {label}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-[3px]">
          <div className="flex gap-[3px] h-[14px]">
            {weeks.map((_, w) => {
              const month = monthLabels.find((m) => m.weekIndex === w);
              return (
                <span key={w} className="w-[11px] text-[0.6rem] text-ink-faint whitespace-nowrap">
                  {month?.label ?? ""}
                </span>
              );
            })}
          </div>

          <div className="flex gap-[3px]">
            {weeks.map((week, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {week.map((day, d) => {
                  const level = day.inRange ? intensityLevel(day.count, maxCount) : 0;
                  const dateLabel = day.date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const title = day.inRange
                    ? `${dateLabel} — ${day.count} task${day.count === 1 ? "" : "s"} completed`
                    : "";
                  return (
                    <div
                      key={d}
                      title={title}
                      className={`w-[11px] h-[11px] rounded-[2px] ${
                        day.inRange && level === 0 ? "border border-line" : ""
                      }`}
                      style={
                        day.inRange && level > 0
                          ? { backgroundColor: "var(--accent)", opacity: LEVEL_OPACITY[level] }
                          : { backgroundColor: "transparent" }
                      }
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 self-end text-[0.65rem] text-ink-faint">
        Less
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span
            key={level}
            className={`w-[11px] h-[11px] rounded-[2px] ${level === 0 ? "border border-line" : ""}`}
            style={level > 0 ? { backgroundColor: "var(--accent)", opacity: LEVEL_OPACITY[level] } : undefined}
          />
        ))}
        More
      </div>
    </div>
  );
}
