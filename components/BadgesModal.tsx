"use client";

import { BADGE_DEFS, EarnedBadge } from "@/lib/badges";
import Modal from "./Modal";

interface BadgesModalProps {
  open: boolean;
  onClose: () => void;
  earned: EarnedBadge[];
}

export default function BadgesModal({ open, onClose, earned }: BadgesModalProps) {
  return (
    <Modal open={open} onClose={onClose} eyebrow="Achievements" title="Badges" widthClass="max-w-xl">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {BADGE_DEFS.map((badge) => {
          const record = earned.find((e) => e.id === badge.id);
          const isEarned = !!record;
          return (
            <div
              key={badge.id}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 text-center transition-colors ${
                isEarned ? "border-accent/40 bg-accent-soft" : "border-line"
              }`}
            >
              <span className={`text-3xl ${isEarned ? "" : "grayscale opacity-40"}`}>{badge.icon}</span>
              <span className={`text-sm font-semibold ${isEarned ? "text-ink-primary" : "text-ink-faint"}`}>
                {badge.label}
              </span>
              <span className="text-xs text-ink-faint leading-snug">{badge.description}</span>
              {isEarned && record && (
                <span className="text-[0.65rem] font-mono text-accent mt-0.5">
                  {new Date(record.earnedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
