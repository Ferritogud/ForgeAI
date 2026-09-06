"use client";

import { useState } from "react";

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

interface AddMilestoneCardProps {
  onAdd: (title: string, weekLabel: number, initialTasks: string[]) => void;
}

export default function AddMilestoneCard({ onAdd }: AddMilestoneCardProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [week, setWeek] = useState("");
  const [tasksText, setTasksText] = useState("");

  const reset = () => {
    setTitle("");
    setWeek("");
    setTasksText("");
    setOpen(false);
  };

  const submit = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const weekNum = Math.max(1, parseInt(week, 10) || 1);
    const initialTasks = tasksText
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    onAdd(trimmedTitle, weekNum, initialTasks);
    reset();
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-[140px] items-center justify-center gap-2 rounded-2xl border border-dashed border-line py-8 text-sm font-medium text-ink-faint transition-colors hover:border-accent hover:text-accent"
      >
        <PlusIcon />
        Add milestone
      </button>
    );
  }

  return (
    <div className="card flex flex-col gap-3 rounded-2xl p-5 animate-fade-up">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && reset()}
          placeholder="Milestone title"
          className="min-w-0 flex-1 rounded-lg border border-line bg-card-muted px-3 py-2 text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-accent"
        />
        <input
          value={week}
          onChange={(e) => setWeek(e.target.value.replace(/[^0-9]/g, ""))}
          onKeyDown={(e) => e.key === "Escape" && reset()}
          placeholder="WK"
          className="w-16 rounded-lg border border-line bg-card-muted px-2 py-2 text-center text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-accent"
        />
      </div>
      <textarea
        value={tasksText}
        onChange={(e) => setTasksText(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && reset()}
        placeholder="Initial tasks (optional, one per line)"
        rows={2}
        className="w-full resize-none rounded-lg border border-line bg-card-muted px-3 py-2 text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-accent"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={reset}
          className="rounded-lg border border-line px-3.5 py-2 text-sm font-medium text-ink-secondary transition-colors hover:border-ink-faint"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!title.trim()}
          className="rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white transition-all hover:brightness-110 disabled:pointer-events-none disabled:opacity-40"
        >
          Add milestone
        </button>
      </div>
    </div>
  );
}
