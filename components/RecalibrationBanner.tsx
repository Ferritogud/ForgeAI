"use client";

import { RecalibrationProposal } from "@/lib/recalibration";
import { formatPhaseRange } from "@/lib/phases";
import GlassCard from "./GlassCard";

function WarningIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path
        d="M8 1.5 15 13.5H1L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M8 6.5v3M8 11.5v.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function CompassIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10.2 5.8 8.9 9l-3.1 1.2L7.1 7l3.1-1.2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  );
}

interface RecalibrationBannerProps {
  proposal: RecalibrationProposal;
  deadline: string | null;
  onAccept: () => void;
  onDismiss: () => void;
}

export default function RecalibrationBanner({ proposal, deadline, onAccept, onDismiss }: RecalibrationBannerProps) {
  const { atRisk, shiftDays, milestoneShifts } = proposal;

  const deadlineLabel = deadline
    ? new Date(`${deadline}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : null;

  return (
    <GlassCard
      className="rounded-2xl p-5 flex flex-col gap-4 animate-fade-up"
      style={{ borderWidth: 1.5, borderColor: atRisk ? "var(--warn)" : "var(--accent)" }}
    >
      <div className="flex items-start gap-3">
        <div className={`shrink-0 mt-0.5 ${atRisk ? "text-warn" : "text-accent"}`}>
          {atRisk ? <WarningIcon /> : <CompassIcon />}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className={`text-sm font-bold ${atRisk ? "text-warn" : "text-ink-primary"}`}>
            {atRisk ? "Your deadline is at risk" : "Your plan has drifted from your pace"}
          </span>
          <p className="text-sm text-ink-secondary leading-snug">
            {atRisk
              ? `At your current pace, you won't hit your ${deadlineLabel ?? "deadline"} deadline. We've compressed your remaining plan to fit — you'll need to increase your pace to stay on track.`
              : `You're about ${shiftDays} day${shiftDays === 1 ? "" : "s"} behind — we can shift your remaining milestones to match your actual pace.`}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 rounded-xl border border-line bg-card-muted p-3">
        {milestoneShifts.map((shift) => (
          <div key={shift.index} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-ink-secondary truncate">{shift.title}</span>
            <span className="font-mono text-ink-faint shrink-0 flex items-center gap-1.5">
              {formatPhaseRange(shift.fromRange.startDate, shift.fromRange.endDate)}
              <span className={atRisk ? "text-warn" : "text-accent"}>→</span>
              {formatPhaseRange(shift.toRange.startDate, shift.toRange.endDate)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onAccept}
          className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 ${
            atRisk ? "bg-warn" : "bg-accent"
          }`}
        >
          Accept new schedule
        </button>
        <button
          onClick={onDismiss}
          className="px-4 py-2 rounded-xl text-sm font-medium text-ink-secondary border border-line hover:border-ink-faint transition-colors"
        >
          Keep original plan
        </button>
      </div>
    </GlassCard>
  );
}
