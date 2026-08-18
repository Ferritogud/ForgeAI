"use client";

import { Milestone } from "@/lib/types";
import GlassCard from "./GlassCard";

interface MilestoneCardProps {
  milestone: Milestone;
  index: number;
  total: number;
  onToggleTask: (taskIndex: number) => void;
}

export default function MilestoneCard({ milestone, index, total, onToggleTask }: MilestoneCardProps) {
  const done = milestone.tasks.filter((t) => t.done).length;
  const taskTotal = milestone.tasks.length;
  const complete = taskTotal > 0 && done === taskTotal;

  const offsetClass = ["", "md:mt-7", "md:mt-3"][index % 3];
  const padClass = index % 3 === 0 ? "p-6" : "p-5";
  const titleClass = index % 3 === 0 ? "text-xl" : "text-lg";

  return (
    <GlassCard
      className={`relative flex flex-col gap-4 animate-fade-up transition-transform duration-300 hover:-translate-y-1.5 ${padClass} ${offsetClass}`}
      style={{
        animationDelay: `${index * 90}ms`,
        opacity: 0,
        borderColor: complete ? "rgba(0, 212, 255, 0.4)" : undefined,
      }}
    >
      {/* Top accent glow bar */}
      <div
        className={`absolute -top-px left-5 right-5 h-px bg-gradient-to-r from-transparent ${
          complete ? "via-blue-glow" : "via-blue-glow/50"
        } to-transparent`}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="hud-label text-blue-glow/70 tracking-[0.2em] whitespace-nowrap">
            Milestone {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <h3 className={`text-ink-primary font-bold mt-1.5 leading-snug ${titleClass}`}>
            {milestone.title}
          </h3>
        </div>
        <span
          className={`shrink-0 font-mono text-xs px-2.5 py-1 rounded-full border ${
            complete
              ? "border-blue-glow/50 text-blue-glow bg-blue-glow/10"
              : "border-base-line text-ink-secondary"
          }`}
        >
          WK {String(milestone.dueWeek).padStart(2, "0")}
        </span>
      </div>

      <div className="hud-divider" />

      <ul className="flex flex-col gap-2.5">
        {milestone.tasks.map((task, i) => (
          <li key={i}>
            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <span className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => onToggleTask(i)}
                  className="peer sr-only"
                />
                <span
                  className="flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border transition-all duration-200
                    border-base-line bg-base-deep
                    peer-checked:border-blue-glow peer-checked:bg-blue-glow/20 peer-checked:shadow-glow-blue-sm
                    group-hover:border-blue-glow/60"
                >
                  <svg
                    viewBox="0 0 12 10"
                    className={`w-2.5 h-2.5 transition-opacity duration-150 ${
                      task.done ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <path
                      d="M1 5L4.5 8.5L11 1.5"
                      stroke="#00D4FF"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </span>
              <span
                className={`text-sm leading-snug transition-colors duration-200 ${
                  task.done ? "text-ink-faint line-through" : "text-ink-secondary group-hover:text-ink-primary"
                }`}
              >
                {task.title}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-1">
        <span className="hud-label text-ink-faint">
          {done}/{taskTotal} tasks complete
        </span>
      </div>
    </GlassCard>
  );
}
