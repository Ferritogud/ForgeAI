"use client";

import { CSSProperties, useEffect, useState } from "react";
import { createPortal } from "react-dom";

const MENU_WIDTH = 168;

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path
        d="M11.3 2.3a1.5 1.5 0 0 1 2.1 2.1L5.6 12.2l-2.9.8.8-2.9 7.8-7.8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path
        d="M3 4.5h10M6.5 4.5v-1a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1M6 7.5v4M10 7.5v4M4 4.5l.6 8a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ProjectMenuProps {
  anchorRect: DOMRect;
  projectName: string;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function ProjectMenu({ anchorRect, projectName, onRename, onDelete, onClose }: ProjectMenuProps) {
  const [confirming, setConfirming] = useState(false);
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

  const estimatedHeight = confirming ? 112 : 84;
  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const openUpward = spaceBelow < estimatedHeight + 12;

  const style: CSSProperties = {
    position: "fixed",
    left: Math.max(8, anchorRect.right - MENU_WIDTH),
    width: MENU_WIDTH,
    ...(openUpward
      ? { bottom: window.innerHeight - anchorRect.top + 6 }
      : { top: anchorRect.bottom + 6 }),
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} onContextMenu={(e) => e.preventDefault()} />
      <div
        style={style}
        className="card z-[100] rounded-xl shadow-md overflow-hidden animate-fade-up"
      >
        {!confirming ? (
          <div className="flex flex-col py-1">
            <button
              onClick={() => {
                onClose();
                onRename();
              }}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-secondary hover:text-ink-primary hover:bg-card-muted transition-colors text-left"
            >
              <PencilIcon />
              Rename
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-ink-secondary hover:text-warn hover:bg-warn-soft transition-colors text-left"
            >
              <TrashIcon />
              Delete
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5 p-3.5">
            <p className="text-xs text-ink-secondary leading-snug">
              Delete <span className="text-ink-primary font-medium">&ldquo;{projectName}&rdquo;</span>? This can&apos;t
              be undone.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-secondary border border-line hover:border-ink-faint transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClose();
                  onDelete();
                }}
                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-warn hover:brightness-110 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
