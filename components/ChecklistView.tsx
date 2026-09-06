"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Project } from "@/lib/types";
import { getMilestoneStatus } from "@/lib/milestones";
import MilestoneCard from "./MilestoneCard";
import AddMilestoneCard from "./AddMilestoneCard";

interface ChecklistViewProps {
  project: Project;
  onToggleTask: (milestoneIndex: number, taskIndex: number) => void;
  onToggleSubtask: (milestoneIndex: number, taskIndex: number, subtaskId: string) => void;
  onAddSubtask: (milestoneIndex: number, taskIndex: number, text: string) => void;
  onUpdateTaskText: (milestoneIndex: number, taskIndex: number, title: string) => void;
  onAddTask: (milestoneIndex: number, title: string) => void;
  onDeleteTask: (milestoneIndex: number, taskIndex: number) => void;
  onReorderTasks: (milestoneIndex: number, fromIndex: number, toIndex: number) => void;
  onUpdateMilestoneTitle: (milestoneIndex: number, title: string) => void;
  onAddMilestone: (title: string, weekLabel: number, initialTasks: string[]) => void;
  onDeleteMilestone: (milestoneIndex: number) => void;
  onRegenerateMilestone: (milestoneIndex: number, title: string, taskTexts: string[]) => void;
  onReorderMilestones: (fromIndex: number, toIndex: number) => void;
  highlightMilestoneId?: string | null;
  onRecordTokens: (tokens: number) => void;
}

export default function ChecklistView({
  project,
  onToggleTask,
  onToggleSubtask,
  onAddSubtask,
  onUpdateTaskText,
  onAddTask,
  onDeleteTask,
  onReorderTasks,
  onUpdateMilestoneTitle,
  onAddMilestone,
  onDeleteMilestone,
  onRegenerateMilestone,
  onReorderMilestones,
  highlightMilestoneId,
  onRecordTokens,
}: ChecklistViewProps) {
  // The first not-yet-complete milestone gets the "current focus" treatment
  // — same completeness definition used elsewhere (0 tasks doesn't count as
  // complete) — and is the one expanded by default in the single-column list.
  const currentFocusIndex = project.milestones.findIndex(
    (m) => !(m.tasks.length > 0 && m.tasks.every((t) => t.completed))
  );

  // Which milestones render expanded vs collapsed. Seeded once from the
  // current-focus milestone; after that it's just whatever the user has
  // toggled — completing the focused milestone doesn't yank it closed or
  // force the next one open, since that would be a jarring layout jump
  // mid-interaction.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const focusMilestone = currentFocusIndex >= 0 ? project.milestones[currentFocusIndex] : null;
    return new Set(focusMilestone ? [focusMilestone.id] : []);
  });

  // A milestone navigated to via highlight (e.g. from the digest/activity
  // modal) needs to actually be open, or the scroll-to would land on a
  // collapsed row showing none of the content it's supposed to highlight.
  useEffect(() => {
    if (!highlightMilestoneId) return;
    setExpandedIds((prev) => (prev.has(highlightMilestoneId) ? prev : new Set(prev).add(highlightMilestoneId)));
  }, [highlightMilestoneId]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === "MILESTONE") {
      onReorderMilestones(source.index, destination.index);
      return;
    }
    if (type.startsWith("TASK-") && source.droppableId === destination.droppableId) {
      const milestoneIndex = Number(type.slice("TASK-".length));
      onReorderTasks(milestoneIndex, source.index, destination.index);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="milestones" type="MILESTONE">
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col gap-4">
            {project.milestones.map((milestone, i) => (
              <Draggable key={milestone.id} draggableId={`milestone-${milestone.id}`} index={i}>
                {(dragProvided) => (
                  <div ref={dragProvided.innerRef} {...dragProvided.draggableProps}>
                    <MilestoneCard
                      milestone={milestone}
                      index={i}
                      total={project.milestones.length}
                      dragHandleProps={dragProvided.dragHandleProps}
                      onToggleTask={(taskIndex) => onToggleTask(i, taskIndex)}
                      onToggleSubtask={(taskIndex, subtaskId) => onToggleSubtask(i, taskIndex, subtaskId)}
                      onAddSubtask={(taskIndex, text) => onAddSubtask(i, taskIndex, text)}
                      onUpdateTaskText={(taskIndex, title) => onUpdateTaskText(i, taskIndex, title)}
                      onAddTask={(title) => onAddTask(i, title)}
                      onDeleteTask={(taskIndex) => onDeleteTask(i, taskIndex)}
                      onUpdateMilestoneTitle={(title) => onUpdateMilestoneTitle(i, title)}
                      onDeleteMilestone={() => onDeleteMilestone(i)}
                      onRegenerateMilestone={(title, taskTexts) => onRegenerateMilestone(i, title, taskTexts)}
                      siblingSummaries={project.milestones.map((m) => ({
                        title: m.title,
                        taskTexts: m.tasks.map((t) => t.text),
                      }))}
                      highlighted={milestone.id === highlightMilestoneId}
                      status={getMilestoneStatus(project, milestone)}
                      isCurrentFocus={i === currentFocusIndex}
                      projectGoal={project.goal}
                      onRecordTokens={onRecordTokens}
                      expanded={expandedIds.has(milestone.id)}
                      onToggleExpanded={() => toggleExpanded(milestone.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            <AddMilestoneCard onAdd={onAddMilestone} />
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
