"use client";

import { CSSProperties, MouseEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PROJECT_ICON_EMOJIS } from "@/lib/emojis";

const PICKER_WIDTH = 232;

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path
        d="M2 4.5a1 1 0 0 1 1-1h3.2l1.2 1.4H13a1 1 0 0 1 1 1v6.1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface ProjectIconButtonProps {
  icon: string | null;
  onSelect: (icon: string) => void;
  size?: "xs" | "sm" | "md";
  className?: string;
}

export default function ProjectIconButton({ icon, onSelect, size = "sm", className = "" }: ProjectIconButtonProps) {
  const [open, setOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const dims = size === "xs" ? "w-5 h-5 text-xs" : size === "sm" ? "w-7 h-7 text-sm" : "w-9 h-9 text-lg";

  const openPicker = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setAnchorRect(e.currentTarget.getBoundingClientRect());
    setOpen(true);
  };

  let popoverStyle: CSSProperties = {};
  if (anchorRect) {
    const estimatedHeight = 168;
    const spaceBelow = window.innerHeight - anchorRect.bottom;
    const openUpward = spaceBelow < estimatedHeight + 12;
    popoverStyle = {
      position: "fixed",
      left: Math.max(8, Math.min(anchorRect.left, window.innerWidth - PICKER_WIDTH - 8)),
      width: PICKER_WIDTH,
      ...(openUpward ? { bottom: window.innerHeight - anchorRect.top + 6 } : { top: anchorRect.bottom + 6 }),
    };
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={openPicker}
        className={`shrink-0 flex items-center justify-center rounded-lg border border-line bg-card-muted text-ink-secondary hover:border-accent hover:text-accent transition-colors ${dims} ${className}`}
        aria-label="Set project icon"
        title="Set project icon"
      >
        {icon ?? <FolderIcon />}
      </button>

      {mounted &&
        open &&
        anchorRect &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
            <div style={popoverStyle} className="card z-[100] rounded-xl shadow-md p-3 animate-fade-up">
              <div className="grid grid-cols-7 gap-1">
                {PROJECT_ICON_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onSelect(emoji);
                      setOpen(false);
                    }}
                    className={`flex items-center justify-center w-7 h-7 rounded-lg text-base hover:bg-accent-soft transition-colors ${
                      icon === emoji ? "bg-accent-soft" : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
