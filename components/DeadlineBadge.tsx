import { daysUntil } from "@/lib/deadline";
import GlassCard from "./GlassCard";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <rect x="2" y="3.5" width="12" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12M5.5 2v2.5M10.5 2v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

interface DeadlineBadgeProps {
  deadline: string;
}

export default function DeadlineBadge({ deadline }: DeadlineBadgeProps) {
  const days = daysUntil(deadline);

  const isOverdue = days < 0;
  const label =
    days > 1
      ? `${days} days until deadline`
      : days === 1
        ? "1 day until deadline"
        : days === 0
          ? "Deadline is today"
          : `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;

  return (
    <GlassCard className="rounded-xl px-3 py-2 flex items-center gap-2 min-w-[150px]">
      <div className={`shrink-0 ${isOverdue ? "text-warn" : "text-accent"}`}>
        <CalendarIcon />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="eyebrow text-2xs">Deadline</span>
        <span className={`text-xs font-medium truncate ${isOverdue ? "text-warn" : "text-ink-primary"}`}>
          {label}
        </span>
      </div>
    </GlassCard>
  );
}
