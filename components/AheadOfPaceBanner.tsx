"use client";

import { AheadOfPaceReport } from "@/lib/recalibration";
import GlassCard from "./GlassCard";

function RocketIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path
        d="M8 1.5c2 1 3.5 3.2 3.5 6 0 1.4-.4 2.6-1 3.5l-2.5 1.5-2.5-1.5c-.6-.9-1-2.1-1-3.5 0-2.8 1.5-5 3.5-6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.5" r="1.2" stroke="currentColor" strokeWidth="1.1" />
      <path d="M5.5 11.5 4 14M10.5 11.5 12 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

interface AheadOfPaceBannerProps {
  report: AheadOfPaceReport;
  onAccelerate: () => void;
  onEnrich: () => void;
  onDismiss: () => void;
  enriching?: boolean;
}

/** Same visual/interaction pattern as RecalibrationBanner (GlassCard, colored left icon, a stat strip, action row) — kept as a separate component since the actions here are a two-way choice rather than a single accept/dismiss. */
export default function AheadOfPaceBanner({ report, onAccelerate, onEnrich, onDismiss, enriching }: AheadOfPaceBannerProps) {
  const days = Math.round(report.avgDaysAhead);

  return (
    <GlassCard className="rounded-2xl p-5 flex flex-col gap-4 animate-fade-up" style={{ borderWidth: 1.5, borderColor: "var(--momentum)" }}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5 text-momentum">
          <RocketIcon />
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-sm font-bold text-ink-primary">You're moving faster than planned</span>
          <p className="text-sm text-ink-secondary leading-snug">
            You've finished your last {report.streakCount} milestones an average of {days} day{days === 1 ? "" : "s"}{" "}
            ahead of schedule. Want to pull your next milestone forward, or add more depth to what you're working on?
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={onAccelerate}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-momentum hover:brightness-110 transition-all"
        >
          Pull timeline forward
        </button>
        <button
          onClick={onEnrich}
          disabled={enriching}
          className="px-4 py-2 rounded-xl text-sm font-medium text-ink-secondary border border-line hover:border-ink-faint transition-colors disabled:opacity-60"
        >
          {enriching ? "Adding depth…" : "Add more depth instead"}
        </button>
        <button
          onClick={onDismiss}
          className="ml-auto px-3 py-2 rounded-xl text-xs font-medium text-ink-faint hover:text-ink-secondary transition-colors"
        >
          Not now
        </button>
      </div>
    </GlassCard>
  );
}
