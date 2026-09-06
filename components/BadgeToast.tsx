"use client";

import { BadgeDef } from "@/lib/badges";

interface BadgeToastProps {
  badge: BadgeDef | null;
}

/**
 * Bottom-right, small, and self-dismissing — deliberately quieter than the
 * top-center mission-complete confetti banner so the two never compete.
 */
export default function BadgeToast({ badge }: BadgeToastProps) {
  if (!badge) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[220] animate-fade-up">
      <div className="card rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 border border-accent/30">
        <span className="text-xl">{badge.icon}</span>
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-semibold text-ink-primary">Badge earned</span>
          <span className="text-xs text-ink-secondary">{badge.label}</span>
        </div>
      </div>
    </div>
  );
}
