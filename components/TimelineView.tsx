"use client";

import { useState } from "react";
import { Project } from "@/lib/types";
import { daysUntil } from "@/lib/deadline";
import { formatPhaseRange } from "@/lib/phases";
import { getMilestoneDateRange } from "@/lib/milestones";
import MilestonePopover from "./MilestonePopover";

const DAY_PX = 16;
const MIN_BLOCK_WIDTH = 130;
const BLOCK_GAP = 28;
const TRACK_INSET = 20;
const DAY_MS = 86400000;

interface TimelineViewProps {
  project: Project;
  onToggleTask: (milestoneIndex: number, taskIndex: number) => void;
}

/** Continuous day offset from project creation — the axis both milestone blocks (by real start/end date) and the today/deadline markers share. */
function dayOffsetFromCreation(dateIso: string, createdAt: string): number {
  return (new Date(dateIso).getTime() - new Date(createdAt).getTime()) / DAY_MS;
}

export default function TimelineView({ project, onToggleTask }: TimelineViewProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const ranges = project.milestones.map((m) => getMilestoneDateRange(project, m));

  // Blocks are packed left-to-right in milestone order, each sized
  // proportionally to its real date-range duration (a 3-week phase renders
  // visibly wider than a 1-week one) — but never narrower than
  // MIN_BLOCK_WIDTH, and never closer to the previous block than BLOCK_GAP
  // allows, so short or close-together phases still stay readable instead of
  // overlapping.
  const positions: number[] = [];
  const widths: number[] = [];
  let rightEdge = TRACK_INSET - BLOCK_GAP;
  for (const { start, end } of ranges) {
    const idealX = TRACK_INSET + dayOffsetFromCreation(start.toISOString(), project.createdAt) * DAY_PX;
    const durationDays = Math.max(1, (end.getTime() - start.getTime()) / DAY_MS);
    const width = Math.max(MIN_BLOCK_WIDTH, durationDays * DAY_PX);
    const x = Math.max(idealX, rightEdge + BLOCK_GAP);
    positions.push(x);
    widths.push(width);
    rightEdge = x + width;
  }

  const todayDayOffset = dayOffsetFromCreation(new Date().toISOString(), project.createdAt);
  const todayX = TRACK_INSET + todayDayOffset * DAY_PX;

  let deadlineX: number | null = null;
  let deadlineLabel = "";
  if (project.deadline) {
    const deadlineDayOffset = dayOffsetFromCreation(`${project.deadline}T00:00:00`, project.createdAt);
    deadlineX = TRACK_INSET + deadlineDayOffset * DAY_PX;
    const days = daysUntil(project.deadline);
    deadlineLabel =
      days === 0 ? "Deadline (today)" : days > 0 ? `Deadline · ${days}d left` : `Deadline · ${Math.abs(days)}d overdue`;
  }

  const trackEnd = rightEdge - BLOCK_GAP;
  const contentWidth = Math.max(trackEnd, todayX, deadlineX ?? 0) + TRACK_INSET + 16;

  const openMilestone = (e: React.MouseEvent<HTMLButtonElement>, index: number) => {
    setAnchorRect(e.currentTarget.getBoundingClientRect());
    setOpenIndex(index);
  };

  return (
    <div className="card rounded-2xl p-5 overflow-x-auto">
      <div style={{ width: contentWidth }} className="relative pt-6">
        {/* Today / deadline markers — full-height vertical lines with a label at the top */}
        {todayX >= 0 && (
          <div className="absolute top-0 bottom-0 z-10 flex flex-col items-center" style={{ left: todayX }}>
            <span className="text-[0.6rem] font-mono uppercase tracking-wide text-accent whitespace-nowrap -translate-x-1/2 mb-1">
              Today
            </span>
            <div className="w-px flex-1 bg-accent" />
          </div>
        )}
        {deadlineX !== null && deadlineX >= 0 && (
          <div className="absolute top-0 bottom-0 z-10 flex flex-col items-center" style={{ left: deadlineX }}>
            <span className="text-[0.6rem] font-mono uppercase tracking-wide text-warn whitespace-nowrap -translate-x-1/2 mb-1">
              {deadlineLabel}
            </span>
            <div className="w-px flex-1 bg-warn" />
          </div>
        )}

        {/* Connecting track */}
        <div
          className="absolute h-px bg-line"
          style={{ top: 32, left: TRACK_INSET, width: Math.max(0, trackEnd - TRACK_INSET) }}
        />

        {/* Stop dots, on the track */}
        {project.milestones.map((milestone, i) => {
          const done = milestone.tasks.filter((t) => t.completed).length;
          const total = milestone.tasks.length;
          const complete = total > 0 && done === total;
          return (
            <div
              key={`dot-${milestone.id}`}
              className={`absolute w-2.5 h-2.5 rounded-full border-2 ${
                complete ? "bg-accent border-accent" : "bg-card border-line"
              }`}
              style={{ top: 32 - 5, left: positions[i] + widths[i] / 2 - 5 }}
            />
          );
        })}

        {/* Milestone stops — all on the same row, connected to the track above */}
        <div className="relative flex" style={{ height: 112, marginTop: 44 }}>
          {project.milestones.map((milestone, i) => {
            const done = milestone.tasks.filter((t) => t.completed).length;
            const total = milestone.tasks.length;
            const percent = total > 0 ? (done / total) * 100 : 0;
            const complete = total > 0 && done === total;

            return (
              <button
                key={milestone.id}
                onClick={(e) => openMilestone(e, i)}
                className={`absolute top-0 rounded-xl border text-left px-3.5 py-3 flex flex-col gap-1.5 transition-colors hover:border-accent ${
                  complete ? "border-accent bg-accent-soft" : "border-line bg-card-muted"
                }`}
                style={{ left: positions[i], width: widths[i] }}
              >
                <span className="text-sm font-semibold text-ink-primary leading-snug line-clamp-2">
                  {milestone.title}
                </span>
                <span className="font-mono text-[0.65rem] text-ink-faint">
                  {done}/{total} · {formatPhaseRange(ranges[i].start.toISOString(), ranges[i].end.toISOString())}
                </span>
                <div className="h-1 w-full rounded-full bg-card overflow-hidden mt-0.5">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {openIndex !== null && anchorRect && (
        <MilestonePopover
          anchorRect={anchorRect}
          milestone={project.milestones[openIndex]}
          onToggleTask={(taskIndex) => onToggleTask(openIndex, taskIndex)}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  );
}
