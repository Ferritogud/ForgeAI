function FlameIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path
        d="M8 1.5s3 2.6 3 5.3a3 3 0 0 1-6 0c0-.7.3-1.3.7-1.9-.2 1 .1 1.6.6 1.9-.3-1.8.6-3 1.7-4.1Zm-2.7 8.9A3.6 3.6 0 0 0 8 14.5a3.6 3.6 0 0 0 2.7-4.1c-.6.9-1.6 1.5-2.7 1.5s-2.1-.6-2.7-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

interface StreakBadgeProps {
  streakCount: number;
}

export default function StreakBadge({ streakCount }: StreakBadgeProps) {
  if (streakCount <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-momentum/30 bg-momentum-soft text-momentum text-xs font-semibold">
      <FlameIcon />
      {streakCount} day{streakCount === 1 ? "" : "s"} streak
    </span>
  );
}
