"use client";

import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Milestone, Task } from "@/lib/types";
import { BoardColumn } from "@/hooks/useProjects";
import { formatPhaseRange } from "@/lib/phases";

interface FlatTask {
  milestoneIndex: number;
  taskIndex: number;
  milestone: Milestone;
  task: Task;
  draggableId: string;
}

interface MilestoneGroup {
  milestoneIndex: number;
  milestone: Milestone;
  items: FlatTask[];
}

const COLUMNS: { id: BoardColumn; label: string }[] = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

function columnOf(task: Task): BoardColumn {
  return task.completed ? "done" : task.kanbanStatus;
}

function flatten(milestones: Milestone[]): FlatTask[] {
  return milestones.flatMap((milestone, milestoneIndex) =>
    milestone.tasks.map((task, taskIndex) => ({
      milestoneIndex,
      taskIndex,
      milestone,
      task,
      draggableId: `${milestoneIndex}-${taskIndex}`,
    }))
  );
}

/** Groups already-column-filtered items by milestone, preserving milestone order (items is built from a milestone-ordered flatMap, so first-seen order is already correct). */
function groupByMilestone(items: FlatTask[]): MilestoneGroup[] {
  const groups: MilestoneGroup[] = [];
  const indexByMilestone = new Map<number, number>();
  for (const item of items) {
    let groupIndex = indexByMilestone.get(item.milestoneIndex);
    if (groupIndex === undefined) {
      groupIndex = groups.length;
      indexByMilestone.set(item.milestoneIndex, groupIndex);
      groups.push({ milestoneIndex: item.milestoneIndex, milestone: item.milestone, items: [] });
    }
    groups[groupIndex].items.push(item);
  }
  return groups;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`w-3 h-3 shrink-0 transition-transform duration-200 ${open ? "" : "-rotate-90"}`}
      fill="none"
    >
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrayIcon() {
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7 text-ink-faint" fill="none">
      <path
        d="M6 8h20l3 9v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8l3-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M3 17h7a3 3 0 0 0 6 0h7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface BoardViewProps {
  milestones: Milestone[];
  onMoveTask: (milestoneIndex: number, taskIndex: number, column: BoardColumn) => void;
}

export default function BoardView({ milestones, onMoveTask }: BoardViewProps) {
  const flat = flatten(milestones);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const [milestoneIndexStr, taskIndexStr] = draggableId.split("-");
    onMoveTask(Number(milestoneIndexStr), Number(taskIndexStr), destination.droppableId as BoardColumn);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const items = flat.filter((f) => columnOf(f.task) === col.id);
          const groups = groupByMilestone(items);
          // Draggable indices must be sequential across the whole Droppable,
          // regardless of which visual milestone section they render under.
          let runningIndex = 0;

          return (
            <div key={col.id} className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="eyebrow">{col.label}</span>
                <span className="font-mono text-xs text-ink-faint">{items.length}</span>
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex flex-col gap-3 min-h-[120px] max-h-[640px] overflow-y-auto p-2 rounded-2xl border transition-colors ${
                      snapshot.isDraggingOver ? "border-accent bg-accent-soft" : "border-line bg-card-muted/50"
                    }`}
                  >
                    {groups.map((group) => {
                      const sectionKey = `${col.id}-${group.milestoneIndex}`;
                      const collapsed = collapsedSections.has(sectionKey);

                      return (
                        <div key={sectionKey} className="flex flex-col gap-2">
                          <button
                            onClick={() => toggleSection(sectionKey)}
                            className="flex items-center gap-1.5 px-1 py-0.5 text-left text-ink-secondary hover:text-ink-primary transition-colors"
                          >
                            <ChevronIcon open={!collapsed} />
                            <span className="text-xs font-medium truncate min-w-0">
                              {group.milestone.startDate && group.milestone.endDate
                                ? formatPhaseRange(group.milestone.startDate, group.milestone.endDate)
                                : ""}{" "}
                              — {group.milestone.title}
                            </span>
                            <span className="font-mono text-2xs text-ink-faint shrink-0">
                              {group.items.length}
                            </span>
                          </button>

                          {!collapsed && (
                            <div className="flex flex-col gap-2">
                              {group.items.map((item) => {
                                const index = runningIndex++;
                                const subDone = item.task.subtasks.filter((s) => s.completed).length;
                                const subTotal = item.task.subtasks.length;

                                return (
                                  <Draggable key={item.draggableId} draggableId={item.draggableId} index={index}>
                                    {(dragProvided, dragSnapshot) => (
                                      <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        {...dragProvided.dragHandleProps}
                                        className={`card rounded-xl px-3 py-2.5 flex items-center gap-2 cursor-grab active:cursor-grabbing transition-shadow ${
                                          dragSnapshot.isDragging ? "shadow-lg" : "shadow-sm"
                                        }`}
                                      >
                                        <p
                                          className={`flex-1 min-w-0 text-sm leading-snug ${
                                            item.task.completed ? "text-ink-faint line-through" : "text-ink-primary"
                                          }`}
                                        >
                                          {item.task.text}
                                        </p>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          {subTotal > 0 && (
                                            <span className="font-mono text-2xs text-ink-faint">
                                              {subDone}/{subTotal}
                                            </span>
                                          )}
                                          <span className="font-mono text-2xs px-1.5 py-0.5 rounded-full border border-line text-ink-secondary">
                                            {item.milestone.startDate && item.milestone.endDate
                                              ? formatPhaseRange(item.milestone.startDate, item.milestone.endDate)
                                              : ""}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {provided.placeholder}
                    {items.length === 0 && (
                      <div className="flex flex-col items-center gap-2 py-8 text-center">
                        <TrayIcon />
                        <p className="text-xs text-ink-faint max-w-[180px] leading-snug">
                          Nothing here yet — drag a task over or check one off
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
