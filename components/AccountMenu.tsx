"use client";

import { CSSProperties, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BADGE_DEFS, EarnedBadge } from "@/lib/badges";

const MENU_WIDTH = 240;

function GearIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1.8v1.6M8 12.6v1.6M14.2 8h-1.6M3.4 8H1.8M12.2 3.8l-1.1 1.1M4.9 11.1l-1.1 1.1M12.2 12.2l-1.1-1.1M4.9 4.9 3.8 3.8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
function SignOutIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path
        d="M6 14H3.5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1H6M10.5 11 14 8l-3.5-3M14 8H6"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md border border-line bg-card-muted text-2xs font-medium text-ink-faint">
      {children}
    </kbd>
  );
}

interface AccountMenuProps {
  anchorRect: DOMRect;
  email: string;
  earnedBadges: EarnedBadge[];
  onOpenSettings: () => void;
  onOpenBadges: () => void;
  onSignOut: () => void;
  onClose: () => void;
}

export default function AccountMenu({
  anchorRect,
  email,
  earnedBadges,
  onOpenSettings,
  onOpenBadges,
  onSignOut,
  onClose,
}: AccountMenuProps) {
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

  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

  // Anchored to the sidebar's bottom-left, always opening upward — the
  // account button lives at the very bottom of the sidebar.
  const style: CSSProperties = {
    position: "fixed",
    left: Math.max(8, anchorRect.left),
    width: Math.max(MENU_WIDTH, anchorRect.width),
    bottom: window.innerHeight - anchorRect.top + 8,
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
      <div style={style} className="card z-[100] rounded-xl shadow-md overflow-hidden animate-fade-up">
        <div className="px-3.5 py-3 border-b border-line">
          <p className="text-xs text-ink-faint truncate">{email}</p>
        </div>
        <button
          onClick={() => {
            onClose();
            onOpenBadges();
          }}
          className="flex items-center justify-between gap-2.5 w-full px-3.5 py-2.5 border-b border-line text-left hover:bg-card-muted transition-colors"
        >
          <span className="text-sm text-ink-secondary">Badges</span>
          {earnedBadges.length === 0 ? (
            <span className="text-xs text-ink-faint">None yet</span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="flex -space-x-1">
                {BADGE_DEFS.filter((d) => earnedBadges.some((e) => e.id === d.id))
                  .slice(0, 5)
                  .map((d) => (
                    <span key={d.id} className="text-sm" aria-hidden="true">
                      {d.icon}
                    </span>
                  ))}
              </span>
              <span className="text-xs text-ink-faint">
                {earnedBadges.length}/{BADGE_DEFS.length}
              </span>
            </span>
          )}
        </button>
        <div className="flex flex-col py-1">
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-card-muted transition-colors text-left"
          >
            <span className="flex items-center gap-2.5">
              <GearIcon />
              Settings
            </span>
            <span className="flex items-center gap-1">
              <KeyBadge>{isMac ? "⌘" : "Ctrl"}</KeyBadge>
              <KeyBadge>,</KeyBadge>
            </span>
          </button>
          <button
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-secondary hover:text-warn hover:bg-warn-soft transition-colors text-left"
          >
            <SignOutIcon />
            Sign out
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
