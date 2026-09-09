"use client";

import { useEffect, useState } from "react";
import Modal from "./Modal";
import InlineMarkdown from "./InlineMarkdown";

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 animate-spin shrink-0">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
      <path
        d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2v3.2h-3.2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="none"
    >
      <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface TaskGuidanceModalProps {
  open: boolean;
  onClose: () => void;
  taskText: string;
  loading: boolean;
  error: string | null;
  summary: string | null;
  steps: string[] | null;
  onRegenerate: () => void;
}

export default function TaskGuidanceModal({
  open,
  onClose,
  taskText,
  loading,
  error,
  summary,
  steps,
  onRegenerate,
}: TaskGuidanceModalProps) {
  const [showSteps, setShowSteps] = useState(false);

  // Every time a different task's guidance opens, start back at the
  // summary-only view rather than remembering the previous task's expansion.
  useEffect(() => {
    if (open) setShowSteps(false);
  }, [open, taskText]);

  return (
    <Modal open={open} onClose={onClose} eyebrow="How do I do this?" title={taskText} widthClass="max-w-md">
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-ink-faint py-2">
          <SpinnerIcon />
          Thinking through this task…
        </div>
      ) : error ? (
        <p className="text-sm text-warn leading-relaxed">{error}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ink-primary leading-relaxed">{summary}</p>

          {!showSteps ? (
            <button
              onClick={() => setShowSteps(true)}
              className="self-start flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
            >
              <ChevronIcon open={false} />
              Show full steps
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowSteps(false)}
                className="self-start flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
              >
                <ChevronIcon open={true} />
                Hide full steps
              </button>
              <ol className="flex flex-col gap-2.5 rounded-lg border border-line bg-card-muted p-3.5">
                {(steps ?? []).map((step, si) => (
                  <li key={si} className="flex items-start gap-2 text-xs text-ink-primary leading-relaxed">
                    <span className="font-mono text-accent shrink-0">{si + 1}.</span>
                    <span>
                      <InlineMarkdown text={step} />
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <button
            onClick={onRegenerate}
            className="self-start flex items-center gap-1 text-2xs text-ink-faint hover:text-accent transition-colors"
          >
            <RefreshIcon />
            Regenerate
          </button>
        </div>
      )}
    </Modal>
  );
}
