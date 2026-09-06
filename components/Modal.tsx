"use client";

import { ReactNode, useEffect } from "react";

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  title: string;
  children: ReactNode;
  widthClass?: string;
}

export default function Modal({ open, onClose, eyebrow, title, children, widthClass = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[130] flex items-center justify-center px-6 transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className={`relative card rounded-2xl w-full ${widthClass} max-h-[85vh] flex flex-col shadow-lg`}>
        <div className="flex items-start justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <p className="eyebrow text-accent">{eyebrow}</p>
            <h3 className="text-xl font-bold text-ink-primary mt-1">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mt-1 -mr-1 rounded-lg text-ink-secondary hover:text-accent hover:bg-accent-soft transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="px-6 pb-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
