"use client";

import { useState } from "react";
import { Milestone, Task, TrashEntry } from "@/lib/types";
import { daysRemaining } from "@/lib/trash";

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

const TYPE_LABEL: Record<TrashEntry["type"], string> = {
  project: "Project",
  milestone: "Milestone",
  task: "Task",
};

function entryName(entry: TrashEntry): string {
  if (entry.type === "project") return entry.projectName;
  if (entry.type === "milestone") return (entry.data as Milestone).title;
  return (entry.data as Task).text;
}

function entryContext(entry: TrashEntry): string | null {
  if (entry.type === "project") return null;
  if (entry.type === "milestone") return `Milestone from "${entry.projectName}"`;
  return `Task from "${entry.milestoneTitle}" milestone, in "${entry.projectName}"`;
}

interface TrashPanelProps {
  entries: TrashEntry[];
  onRestore: (trashId: string) => { ok: boolean; reason?: string };
  onDeletePermanently: (trashId: string) => void;
  onEmptyTrash: () => void;
}

export default function TrashPanel({ entries, onRestore, onDeletePermanently, onEmptyTrash }: TrashPanelProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmingEmpty, setConfirmingEmpty] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const handleRestore = (trashId: string) => {
    const result = onRestore(trashId);
    setRestoreError(result.ok ? null : result.reason ?? "Couldn't restore that item.");
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Trash</span>
        {entries.length > 0 &&
          (!confirmingEmpty ? (
            <button
              onClick={() => setConfirmingEmpty(true)}
              className="text-xs font-medium text-warn hover:brightness-110 transition-all"
            >
              Empty trash
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmingEmpty(false)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-ink-secondary border border-line hover:border-ink-faint transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onEmptyTrash();
                  setConfirmingEmpty(false);
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-medium text-white bg-warn hover:brightness-110 transition-all"
              >
                Confirm
              </button>
            </div>
          ))}
      </div>

      {restoreError && <p className="text-xs text-warn leading-snug">{restoreError}</p>}

      {entries.length === 0 ? (
        <p className="text-xs text-ink-faint leading-snug">
          Nothing here. Deleted projects, milestones, and tasks stick around for 30 days before they&apos;re
          gone for good.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {entries.map((entry) => {
            const context = entryContext(entry);
            const left = daysRemaining(entry.deletedAt);
            const confirming = confirmingId === entry.id;

            return (
              <div key={entry.id} className="flex flex-col gap-2 p-3 rounded-xl border border-line bg-card-muted">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[0.6rem] font-mono uppercase tracking-wide text-ink-faint px-1.5 py-0.5 rounded-full border border-line">
                        {TYPE_LABEL[entry.type]}
                      </span>
                      <span className="text-xs font-mono text-ink-faint">{left} day{left === 1 ? "" : "s"} left</span>
                    </div>
                    <p className="text-sm text-ink-primary font-medium mt-1 truncate">{entryName(entry)}</p>
                    {context && <p className="text-xs text-ink-faint mt-0.5 leading-snug">{context}</p>}
                  </div>
                </div>

                {!confirming ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRestore(entry.id)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-accent border border-accent/40 hover:bg-accent-soft transition-colors"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => setConfirmingId(entry.id)}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-faint hover:text-warn transition-colors"
                    >
                      <TrashIcon />
                      Delete permanently
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-xs text-ink-secondary leading-snug">Delete forever?</p>
                    <button
                      onClick={() => setConfirmingId(null)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-secondary border border-line hover:border-ink-faint transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        onDeletePermanently(entry.id);
                        setConfirmingId(null);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-warn hover:brightness-110 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
