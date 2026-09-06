"use client";

import { CSSProperties, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Milestone } from "@/lib/types";
import { formatPhaseRange } from "@/lib/phases";

const POPOVER_WIDTH = 280;

interface MilestonePopoverProps {
  anchorRect: DOMRect;
  milestone: Milestone;
  onToggleTask: (taskIndex: number) => void;
  onClose: () => void;
}

export default function MilestonePopover({ anchorRect, milestone, onToggleTask, onClose }: MilestonePopoverProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  const estimatedHeight = 80 + milestone.tasks.length * 28;
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const openUpward = spaceBelow < estimatedHeight + 16;

  const left = Math.min(
    Math.max(8, anchorRect.left),
    window.innerWidth - POPOVER_WIDTH - 8
  );

  const style: CSSProperties = {
    position: "fixed",
    left,
    width: POPOVER_WIDTH,
    maxHeight: "60vh",
    ...(openUpward ? { bottom: window.innerHeight - anchorRect.top + 8 } : { top: anchorRect.bottom + 8 }),
  };

  const done = milestone.tasks.filter((t) => t.completed).length;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} />
      <div style={style} className="card z-[100] rounded-xl shadow-lg overflow-y-auto animate-fade-up">
        <div className="p-3.5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-ink-primary truncate">{milestone.title}</span>
            <span className="font-mono text-[0.65rem] px-2 py-0.5 rounded-full border border-line text-ink-secondary shrink-0">
              {milestone.startDate && milestone.endDate ? formatPhaseRange(milestone.startDate, milestone.endDate) : ""}
            </span>
          </div>
          <span className="font-mono text-xs text-ink-faint">
            {done}/{milestone.tasks.length} tasks complete
          </span>
          <div className="divider" />
          <ul className="flex flex-col gap-2">
            {milestone.tasks.map((task, i) => (
              <li key={i}>
                <label className="flex items-start gap-2.5 cursor-pointer select-none group">
                  <span className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => onToggleTask(i)}
                      className="peer sr-only"
                    />
                    <span
                      className="flex items-center justify-center w-[16px] h-[16px] rounded border transition-all duration-200
                        border-line bg-card-muted
                        peer-checked:border-accent peer-checked:bg-accent-soft
                        group-hover:border-accent"
                    >
                      <svg
                        viewBox="0 0 12 10"
                        className={`w-2.5 h-2.5 transition-opacity duration-150 text-accent ${
                          task.completed ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <path
                          d="M1 5L4.5 8.5L11 1.5"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </span>
                  <span
                    className={`text-xs leading-snug ${
                      task.completed ? "text-ink-faint line-through" : "text-ink-secondary group-hover:text-ink-primary"
                    }`}
                  >
                    {task.text}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>,
    document.body
  );
}
