import { KanbanStatus, Milestone, SubTask, Task } from "./types";

export function makeSubtaskId(): string {
  return `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makeMilestoneId(): string {
  return `mst_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function makeTaskId(): string {
  return `tsk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeSubtask(s: Partial<SubTask>): SubTask {
  return {
    id: s.id ?? makeSubtaskId(),
    text: s.text ?? "",
    completed: s.completed ?? false,
  };
}

/**
 * Backfills fields added after some tasks were already saved/generated, AND
 * migrates the pre-cleanup field names (title/done/status) that are still
 * sitting in localStorage for anyone who used the app before this pass —
 * without this, the schema-cleanup rename would silently wipe every
 * existing task's text and completion state on next load.
 */
interface LegacyTaskFields {
  title?: string;
  done?: boolean;
  status?: string;
}

/**
 * Accepts a bare string as shorthand for a task with just text — the
 * Anthropic API has been observed returning tasks as plain strings
 * ("Gather materials...") instead of the requested { "text": "..." } object
 * shape despite the prompt asking for objects, and silently produced
 * empty-text tasks (`t.text` on a string is undefined) before this handled
 * it. Kept permanently as a defensive normalization boundary, not just a
 * one-off patch, since this is the one place all task data — API responses,
 * templates, mock data, hand-authored content — funnels through.
 */
export function normalizeTask(t: (Partial<Task> & LegacyTaskFields) | string): Task {
  const raw = typeof t === "string" ? { text: t } : t;
  const text = raw.text ?? raw.title ?? "";

  if (!text.trim()) {
    console.warn("[normalizeTask] task has no usable text after normalization — raw input:", t);
  }

  return {
    id: raw.id ?? makeTaskId(),
    text,
    completed: raw.completed ?? raw.done ?? false,
    kanbanStatus: (raw.kanbanStatus ?? (raw.status as KanbanStatus | undefined)) ?? "todo",
    completedAt: raw.completedAt ?? null,
    subtasks: (raw.subtasks ?? []).map(normalizeSubtask),
  };
}

interface LegacyMilestoneFields {
  weekLabel?: number;
  dueWeek?: number;
  tasks: ((Partial<Task> & LegacyTaskFields) | string)[];
}

export function normalizeMilestones(milestones: (Partial<Omit<Milestone, "tasks">> & LegacyMilestoneFields)[]): Milestone[] {
  return milestones.map((m) => ({
    id: m.id ?? makeMilestoneId(),
    title: m.title ?? "",
    weekLabel: m.weekLabel ?? m.dueWeek ?? 1,
    deadline: m.deadline ?? null,
    startDate: m.startDate ?? null,
    endDate: m.endDate ?? null,
    tasks: m.tasks.map(normalizeTask),
  }));
}
