"use client";

import { useEffect, useRef, useState } from "react";
import { Droppable, Draggable, DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { Milestone, MilestoneStatus, Task } from "@/lib/types";
import { loadTaskGuidance, saveTaskGuidance } from "@/lib/storage";
import { formatPhaseRange } from "@/lib/phases";
import GlassCard from "./GlassCard";
import EditableText from "./EditableText";
import TaskGuidanceModal from "./TaskGuidanceModal";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="none"
    >
      <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3 h-3" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
function SparkleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path d="M8 1.5 9.2 5.3 13 6.5l-3.8 1.2L8 11.5 6.8 7.7 3 6.5l3.8-1.2L8 1.5Z" fill="currentColor" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
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
function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 animate-spin shrink-0">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3 h-3 text-success shrink-0" fill="none">
      <path d="M3 8.5 6.5 12 13 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="currentColor">
      <circle cx="5.5" cy="4" r="1" />
      <circle cx="10.5" cy="4" r="1" />
      <circle cx="5.5" cy="8" r="1" />
      <circle cx="10.5" cy="8" r="1" />
      <circle cx="5.5" cy="12" r="1" />
      <circle cx="10.5" cy="12" r="1" />
    </svg>
  );
}

interface MilestoneCardProps {
  milestone: Milestone;
  index: number;
  total: number;
  onToggleTask: (taskIndex: number) => void;
  onToggleSubtask: (taskIndex: number, subtaskId: string) => void;
  onAddSubtask: (taskIndex: number, text: string) => void;
  onUpdateTaskText: (taskIndex: number, title: string) => void;
  onAddTask: (title: string) => void;
  onDeleteTask: (taskIndex: number) => void;
  onUpdateMilestoneTitle: (title: string) => void;
  onDeleteMilestone: () => void;
  onRegenerateMilestone: (title: string, taskTexts: string[]) => void;
  siblingSummaries: { title: string; taskTexts: string[] }[];
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  highlighted?: boolean;
  status: MilestoneStatus;
  isCurrentFocus?: boolean;
  projectGoal: string;
  onRecordTokens: (tokens: number) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

export default function MilestoneCard({
  milestone,
  index,
  total,
  onToggleTask,
  onToggleSubtask,
  onAddSubtask,
  onUpdateTaskText,
  onAddTask,
  onDeleteTask,
  onUpdateMilestoneTitle,
  onDeleteMilestone,
  onRegenerateMilestone,
  siblingSummaries,
  dragHandleProps,
  highlighted,
  status,
  isCurrentFocus,
  projectGoal,
  onRecordTokens,
  expanded,
  onToggleExpanded,
}: MilestoneCardProps) {
  const done = milestone.tasks.filter((t) => t.completed).length;
  const taskTotal = milestone.tasks.length;
  const complete = taskTotal > 0 && done === taskTotal;
  const percent = taskTotal > 0 ? (done / taskTotal) * 100 : 0;
  const phaseRange = milestone.startDate && milestone.endDate ? formatPhaseRange(milestone.startDate, milestone.endDate) : "";
  const emphasized = highlighted || (isCurrentFocus && !complete);
  const cardClassName =
    "group/card relative flex flex-col gap-4 animate-fade-up rounded-2xl p-6 shadow-sm transition-[border-color,box-shadow,filter] duration-300" +
    (complete ? " [filter:opacity(60%)] hover:[filter:opacity(100%)]" : "");
  const rowClassName =
    "group/row relative flex items-center gap-2.5 animate-fade-up rounded-2xl px-4 py-2.5 shadow-sm transition-[border-color,box-shadow,filter] duration-300 hover:border-accent/50" +
    (complete ? " [filter:opacity(65%)] hover:[filter:opacity(100%)]" : "");

  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (highlighted) rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlighted]);

  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<number>>(new Set());
  const [draftByTask, setDraftByTask] = useState<Record<number, string>>({});
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskDraft, setNewTaskDraft] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [regenerateFeedback, setRegenerateFeedback] = useState("");
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);

  const [openGuidanceIndex, setOpenGuidanceIndex] = useState<number | null>(null);
  const [guidanceLoading, setGuidanceLoading] = useState<Set<number>>(new Set());
  const [guidanceError, setGuidanceError] = useState<Record<number, string>>({});
  const [guidance, setGuidance] = useState<Record<number, { summary: string; steps: string[] }>>({});

  const toggleSubtaskExpanded = (taskIndex: number) => {
    setExpandedSubtasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskIndex)) next.delete(taskIndex);
      else next.add(taskIndex);
      return next;
    });
  };

  const loadGuidance = async (taskIndex: number, task: Task, force = false) => {
    if (!force) {
      const cached = loadTaskGuidance(task.id);
      if (cached && cached.summary) {
        setGuidance((prev) => ({ ...prev, [taskIndex]: { summary: cached.summary, steps: cached.steps } }));
        return;
      }
    }

    setGuidanceLoading((prev) => new Set(prev).add(taskIndex));
    setGuidanceError((prev) => {
      const next = { ...prev };
      delete next[taskIndex];
      return next;
    });

    try {
      const res = await fetch("/api/task-guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: projectGoal,
          milestoneTitle: milestone.title,
          taskText: task.text,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setGuidanceError((prev) => ({ ...prev, [taskIndex]: data.error }));
        return;
      }

      setGuidance((prev) => ({ ...prev, [taskIndex]: { summary: data.summary, steps: data.steps } }));
      saveTaskGuidance(task.id, data.summary, data.steps);
      // Mock replies never carry a usage field, so this is a no-op (and free) with no key configured.
      if (data.usage) onRecordTokens(data.usage.inputTokens + data.usage.outputTokens);
    } catch {
      setGuidanceError((prev) => ({ ...prev, [taskIndex]: "Something went wrong generating guidance." }));
    } finally {
      setGuidanceLoading((prev) => {
        const next = new Set(prev);
        next.delete(taskIndex);
        return next;
      });
    }
  };

  const openGuidance = (taskIndex: number, task: Task) => {
    setOpenGuidanceIndex(taskIndex);
    if (!guidance[taskIndex]) loadGuidance(taskIndex, task);
  };

  const submitSubtask = (taskIndex: number) => {
    const text = (draftByTask[taskIndex] ?? "").trim();
    if (!text) return;
    onAddSubtask(taskIndex, text);
    setDraftByTask((prev) => ({ ...prev, [taskIndex]: "" }));
  };

  const submitNewTask = () => {
    const text = newTaskDraft.trim();
    if (!text) {
      setAddingTask(false);
      return;
    }
    onAddTask(text);
    setNewTaskDraft("");
  };

  const submitRegenerate = async () => {
    setRegenerating(true);
    setRegenerateError(null);
    try {
      const res = await fetch("/api/regenerate-milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: projectGoal,
          milestones: siblingSummaries,
          targetIndex: index,
          feedback: regenerateFeedback.trim(),
        }),
      });
      const data = await res.json();

      if (data.error) {
        setRegenerateError(data.error);
        return;
      }

      onRegenerateMilestone(data.title, data.tasks);
      if (data.usage) onRecordTokens(data.usage.inputTokens + data.usage.outputTokens);
      setRegenerateOpen(false);
      setRegenerateFeedback("");
    } catch {
      setRegenerateError("Something went wrong regenerating this milestone.");
    } finally {
      setRegenerating(false);
    }
  };

  const regenerateBanner = regenerateOpen && (
    <div className="flex flex-col gap-2.5 rounded-xl border border-accent/30 bg-accent-soft px-3.5 py-3">
      <p className="text-xs font-medium text-ink-primary">What would you change about this milestone?</p>
      <input
        autoFocus
        value={regenerateFeedback}
        onChange={(e) => setRegenerateFeedback(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !regenerating) submitRegenerate();
          if (e.key === "Escape") {
            setRegenerateOpen(false);
            setRegenerateError(null);
          }
        }}
        placeholder={'Optional — e.g. "too easy" or "focus more on X instead"'}
        disabled={regenerating}
        className="w-full rounded-lg border border-line bg-card px-3 py-2 text-xs text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-accent disabled:opacity-60"
      />
      {regenerateError && <p className="text-xs text-warn leading-snug">{regenerateError}</p>}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => {
            setRegenerateOpen(false);
            setRegenerateError(null);
          }}
          disabled={regenerating}
          className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-secondary hover:border-ink-faint transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={submitRegenerate}
          disabled={regenerating}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-white hover:brightness-110 transition-all disabled:opacity-60"
        >
          {regenerating ? (
            <>
              <SpinnerIcon />
              Regenerating…
            </>
          ) : (
            "Regenerate"
          )}
        </button>
      </div>
    </div>
  );

  const deleteConfirmBanner = confirmingDelete && (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-warn/40 bg-warn-soft px-3 py-2">
      <p className="text-xs leading-snug text-ink-secondary">
        Delete this milestone and its {taskTotal} task{taskTotal === 1 ? "" : "s"}?
      </p>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={() => setConfirmingDelete(false)}
          className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-secondary hover:border-ink-faint transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onDeleteMilestone}
          className="rounded-lg bg-warn px-2.5 py-1 text-xs font-medium text-white hover:brightness-110 transition-all"
        >
          Delete
        </button>
      </div>
    </div>
  );

  if (!expanded) {
    return (
      <div ref={rootRef} className="flex flex-col gap-2">
        <GlassCard
          className={rowClassName}
          style={{
            animationDelay: `${index * 90}ms`,
            opacity: 0,
            borderColor: emphasized ? "var(--accent)" : undefined,
            boxShadow: emphasized ? "0 0 0 3px var(--accent-soft)" : undefined,
          }}
        >
          <button
            {...dragHandleProps}
            className="shrink-0 cursor-grab rounded p-0.5 text-ink-faint opacity-0 transition-opacity active:cursor-grabbing group-hover/row:opacity-100 hover:text-accent"
            aria-label="Reorder milestone"
          >
            <GripIcon />
          </button>

          <button onClick={onToggleExpanded} className="flex flex-1 min-w-0 items-center gap-3 text-left">
            <span className="shrink-0 text-ink-faint">
              <ChevronIcon open={false} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="eyebrow">
                  Phase {index + 1} of {total}
                </span>
                {complete && <CheckIcon />}
                {status === "slipped" && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-warn shrink-0"
                    title="Slipped — past its expected date"
                    aria-label="Milestone slipped"
                  />
                )}
              </div>
              <h3 className="text-sm text-ink-primary font-semibold leading-snug truncate">{milestone.title}</h3>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-2.5">
            <span className="font-mono text-xs text-ink-faint whitespace-nowrap">
              {done}/{taskTotal}
            </span>
            <div className="w-14 h-1 rounded-full bg-card-muted overflow-hidden hidden sm:block">
              <div
                className={`h-full rounded-full ${complete ? "bg-success" : "bg-accent"}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span
              className={`font-mono text-[0.7rem] px-2 py-0.5 rounded-full border whitespace-nowrap ${
                complete ? "border-success text-success bg-success-soft" : "border-line text-ink-secondary"
              }`}
            >
              {phaseRange}
            </span>
            {!confirmingDelete && (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="shrink-0 rounded p-1 text-ink-faint opacity-0 transition-opacity group-hover/row:opacity-100 hover:text-warn"
                aria-label="Delete milestone"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        </GlassCard>
        {deleteConfirmBanner}
      </div>
    );
  }

  return (
    <div>
      <GlassCard
        ref={rootRef}
        className={cardClassName}
      style={{
        animationDelay: `${index * 90}ms`,
        opacity: 0,
        borderColor: emphasized ? "var(--accent)" : undefined,
        boxShadow: emphasized ? "0 0 0 3px var(--accent-soft)" : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <button
              {...dragHandleProps}
              className="shrink-0 cursor-grab rounded p-0.5 text-ink-faint opacity-0 transition-opacity active:cursor-grabbing group-hover/card:opacity-100 hover:text-accent"
              aria-label="Reorder milestone"
            >
              <GripIcon />
            </button>
            <span className="eyebrow">
              Phase {index + 1} of {total}
            </span>
          </div>
          <EditableText
            value={milestone.title}
            onSave={onUpdateMilestoneTitle}
            as="h3"
            className="text-ink-primary font-bold mt-1 leading-snug text-xl"
          />
          <div className="h-1 w-full rounded-full bg-card-muted overflow-hidden mt-2 max-w-md">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${complete ? "bg-success" : "bg-accent"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {status === "slipped" && (
            <span
              className="w-2 h-2 rounded-full bg-warn shrink-0"
              title="Slipped — past its expected date"
              aria-label="Milestone slipped"
            />
          )}
          <span
            className={`font-mono text-[0.7rem] px-2 py-0.5 rounded-full border ${
              complete ? "border-success text-success bg-success-soft" : "border-line text-ink-secondary"
            }`}
          >
            {phaseRange}
          </span>
          {!confirmingDelete && !regenerateOpen ? (
            <button
              onClick={() => setRegenerateOpen(true)}
              className="rounded p-1 text-ink-faint opacity-0 transition-opacity group-hover/card:opacity-100 hover:text-accent"
              aria-label="This isn't right — regenerate this milestone"
              title="This isn't right — regenerate"
            >
              <RefreshIcon />
            </button>
          ) : null}
          {!confirmingDelete ? (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="rounded p-1 text-ink-faint opacity-0 transition-opacity group-hover/card:opacity-100 hover:text-warn"
              aria-label="Delete milestone"
            >
              <TrashIcon />
            </button>
          ) : null}
          <button
            onClick={onToggleExpanded}
            className="rounded p-1 text-ink-faint hover:text-accent transition-colors"
            aria-label="Collapse milestone"
            title="Collapse"
          >
            <ChevronIcon open />
          </button>
        </div>
      </div>

      {regenerateBanner}
      {deleteConfirmBanner}

      <div className="divider shrink-0" />

      <Droppable droppableId={`tasks-${index}`} type={`TASK-${index}`}>
        {(dropProvided) => (
          <ul ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="flex flex-col gap-3.5">
            {milestone.tasks.map((task, i) => {
              const isExpanded = expandedSubtasks.has(i);
              const subDone = task.subtasks.filter((s) => s.completed).length;
              const subTotal = task.subtasks.length;

              return (
                <Draggable key={task.id} draggableId={`task-${index}-${task.id}`} index={i}>
                  {(taskDragProvided, taskDragSnapshot) => (
                    <li
                      ref={taskDragProvided.innerRef}
                      {...taskDragProvided.draggableProps}
                      className={`flex flex-col ${taskDragSnapshot.isDragging ? "bg-card shadow-lg rounded-lg" : ""}`}
                    >
                      <div className="group/task flex items-start gap-1.5">
                        <button
                          {...taskDragProvided.dragHandleProps}
                          className="shrink-0 mt-0.5 cursor-grab rounded p-0.5 text-ink-faint opacity-0 transition-opacity active:cursor-grabbing group-hover/task:opacity-100 hover:text-accent"
                          aria-label="Reorder task"
                        >
                          <GripIcon />
                        </button>

                        <span className="relative mt-0.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => onToggleTask(i)}
                            className="peer sr-only"
                            id={`task-${index}-${i}-checkbox`}
                          />
                          <label
                            htmlFor={`task-${index}-${i}-checkbox`}
                            className="flex items-center justify-center w-[18px] h-[18px] rounded-[5px] border cursor-pointer transition-all duration-200
                              border-line bg-card-muted
                              peer-checked:border-success peer-checked:bg-success-soft
                              hover:border-success"
                          >
                            <svg
                              viewBox="0 0 12 10"
                              className={`w-2.5 h-2.5 transition-opacity duration-150 text-success ${
                                task.completed ? "opacity-100" : "opacity-0"
                              }`}
                            >
                              <path
                                d="M1 5L4.5 8.5L11 1.5"
                                stroke="currentColor"
                                strokeWidth="2"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </label>
                        </span>

                        <div className="min-w-0 flex-1">
                          <EditableText
                            value={task.text}
                            onSave={(title) => onUpdateTaskText(i, title)}
                            className={`block text-sm leading-snug transition-colors duration-200 ${
                              task.completed ? "text-ink-faint line-through" : "text-ink-secondary"
                            }`}
                          />
                        </div>

                        <button
                          onClick={() => openGuidance(i, task)}
                          className={`shrink-0 rounded p-1 transition-colors ${
                            openGuidanceIndex === i ? "text-accent" : "text-ink-faint hover:text-accent"
                          }`}
                          aria-label="How do I do this?"
                          title="How do I do this?"
                        >
                          <SparkleIcon />
                        </button>

                        <button
                          onClick={() => toggleSubtaskExpanded(i)}
                          className="shrink-0 flex items-center gap-1 px-1 py-0.5 rounded text-ink-faint hover:text-accent transition-colors"
                          aria-label={isExpanded ? "Collapse sub-tasks" : "Expand sub-tasks"}
                        >
                          {subTotal > 0 && (
                            <span className="font-mono text-[0.65rem]">
                              {subDone}/{subTotal}
                            </span>
                          )}
                          <ChevronIcon open={isExpanded} />
                        </button>

                        <button
                          onClick={() => onDeleteTask(i)}
                          className="shrink-0 rounded p-0.5 text-ink-faint opacity-0 transition-opacity group-hover/task:opacity-100 hover:text-warn"
                          aria-label="Delete task"
                        >
                          <CloseIcon />
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="ml-[46px] mt-2 flex flex-col gap-2 border-l border-line pl-3">
                          {task.subtasks.map((sub) => (
                            <label key={sub.id} className="flex items-start gap-2.5 cursor-pointer select-none group/sub">
                              <span className="relative mt-0.5 shrink-0">
                                <input
                                  type="checkbox"
                                  checked={sub.completed}
                                  onChange={() => onToggleSubtask(i, sub.id)}
                                  className="peer sr-only"
                                />
                                <span
                                  className="flex items-center justify-center w-[14px] h-[14px] rounded border transition-all duration-200
                                    border-line bg-card-muted
                                    peer-checked:border-success peer-checked:bg-success-soft
                                    group-hover/sub:border-success"
                                >
                                  <svg
                                    viewBox="0 0 12 10"
                                    className={`w-2 h-2 transition-opacity duration-150 text-success ${
                                      sub.completed ? "opacity-100" : "opacity-0"
                                    }`}
                                  >
                                    <path
                                      d="M1 5L4.5 8.5L11 1.5"
                                      stroke="currentColor"
                                      strokeWidth="2.2"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                              </span>
                              <span
                                className={`text-xs leading-snug ${
                                  sub.completed ? "text-ink-faint line-through" : "text-ink-secondary group-hover/sub:text-ink-primary"
                                }`}
                              >
                                {sub.text}
                              </span>
                            </label>
                          ))}

                          <div className="flex items-center gap-1.5 mt-0.5">
                            <PlusIcon />
                            <input
                              value={draftByTask[i] ?? ""}
                              onChange={(e) => setDraftByTask((prev) => ({ ...prev, [i]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") submitSubtask(i);
                              }}
                              placeholder="Add sub-task..."
                              className="flex-1 min-w-0 bg-transparent text-xs text-ink-primary placeholder:text-ink-faint focus:outline-none py-0.5"
                            />
                          </div>
                        </div>
                      )}
                    </li>
                  )}
                </Draggable>
              );
            })}
            {dropProvided.placeholder}
          </ul>
        )}
      </Droppable>

      {addingTask ? (
        <div className="flex items-center gap-1.5 pl-1.5 shrink-0">
          <PlusIcon />
          <input
            autoFocus
            value={newTaskDraft}
            onChange={(e) => setNewTaskDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitNewTask();
              } else if (e.key === "Escape") {
                setNewTaskDraft("");
                setAddingTask(false);
              }
            }}
            onBlur={() => {
              submitNewTask();
              setAddingTask(false);
            }}
            placeholder="Task name..."
            className="flex-1 min-w-0 bg-transparent text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none py-0.5"
          />
        </div>
      ) : (
        <button
          onClick={() => setAddingTask(true)}
          className="flex shrink-0 items-center gap-1.5 pl-1.5 py-0.5 text-xs text-ink-faint hover:text-accent transition-colors self-start"
        >
          <PlusIcon />
          Add task
        </button>
      )}

      <div className="shrink-0 pt-1">
        <span className="font-mono text-xs text-ink-faint">
          {done}/{taskTotal} tasks complete
        </span>
      </div>
    </GlassCard>

      <TaskGuidanceModal
        open={openGuidanceIndex !== null}
        onClose={() => setOpenGuidanceIndex(null)}
        taskText={openGuidanceIndex !== null ? milestone.tasks[openGuidanceIndex]?.text ?? "" : ""}
        loading={openGuidanceIndex !== null && guidanceLoading.has(openGuidanceIndex)}
        error={openGuidanceIndex !== null ? guidanceError[openGuidanceIndex] ?? null : null}
        summary={openGuidanceIndex !== null ? guidance[openGuidanceIndex]?.summary ?? null : null}
        steps={openGuidanceIndex !== null ? guidance[openGuidanceIndex]?.steps ?? null : null}
        onRegenerate={() => {
          if (openGuidanceIndex === null) return;
          const task = milestone.tasks[openGuidanceIndex];
          if (task) loadGuidance(openGuidanceIndex, task, true);
        }}
      />
    </div>
  );
}
