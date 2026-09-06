"use client";

import { Project } from "@/lib/types";
import { computeWeeklyDigest } from "@/lib/digest";
import { Trend } from "@/lib/projections";
import Modal from "./Modal";

const TREND_LABEL: Record<Trend, { text: string; className: string }> = {
  ahead: { text: "Ahead of pace", className: "text-accent" },
  "on-track": { text: "On track", className: "text-accent" },
  behind: { text: "Behind pace", className: "text-warn" },
  complete: { text: "Complete", className: "text-accent" },
  unknown: { text: "Awaiting data", className: "text-ink-faint" },
};

interface DigestModalProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
}

export default function DigestModal({ open, onClose, project }: DigestModalProps) {
  const digest = project ? computeWeeklyDigest(project) : null;
  const trendCfg = digest ? TREND_LABEL[digest.trend] : null;

  return (
    <Modal open={open} onClose={onClose} eyebrow="This Week" title={project?.name ?? "No active mission"}>
      {digest && trendCfg ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line p-3.5">
              <p className="eyebrow mb-1.5">Tasks completed</p>
              <p className="text-2xl font-bold text-ink-primary">{digest.tasksCompletedThisWeek}</p>
            </div>
            <div className="rounded-xl border border-line p-3.5">
              <p className="eyebrow mb-1.5">Pace</p>
              <p className={`text-sm font-semibold ${trendCfg.className}`}>{trendCfg.text}</p>
            </div>
            <div className="rounded-xl border border-line p-3.5">
              <p className="eyebrow mb-1.5">Streak</p>
              <p className="text-2xl font-bold text-ink-primary">
                {digest.streakCount} day{digest.streakCount === 1 ? "" : "s"}
              </p>
            </div>
            <div className="rounded-xl border border-line p-3.5">
              <p className="eyebrow mb-1.5">Projection</p>
              <p className="text-sm font-semibold text-ink-primary font-mono">{digest.projectionLabel}</p>
            </div>
          </div>

          <div>
            <p className="eyebrow mb-2">Milestones worked on</p>
            {digest.milestonesWorkedOn.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {digest.milestonesWorkedOn.map((title) => (
                  <li key={title} className="text-sm text-ink-secondary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                    {title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-faint">None this week.</p>
            )}
          </div>

          <div className="rounded-xl border border-accent/30 bg-accent-soft p-3.5">
            <p className="text-sm text-ink-primary leading-snug">{digest.closingLine}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-faint">Create or select a project to see this week&apos;s digest.</p>
      )}
    </Modal>
  );
}
