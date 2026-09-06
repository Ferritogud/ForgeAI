"use client";

import { useCallback, useEffect, useState } from "react";
import { Attachment, ChatMessage, KanbanStatus, Milestone, Project, RawMilestone, Task, TrashEntry } from "@/lib/types";
import {
  createProjectId,
  loadActiveProjectId,
  loadProjects,
  loadTrash,
  saveActiveProjectId,
  saveProjects,
  saveTrash,
  shortName,
} from "@/lib/storage";
import { recordActivity } from "@/lib/streak";
import { makeMilestoneId, makeSubtaskId, normalizeMilestones, normalizeTask } from "@/lib/tasks";
import { deriveSingleMilestoneDateRange, ensureMilestoneDateRanges } from "@/lib/phases";
import { makeTrashId, purgeExpiredTrash } from "@/lib/trash";

/** Kanban column a task currently belongs to, derived from done + status. */
export type BoardColumn = "todo" | "in-progress" | "done";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [trash, setTrash] = useState<TrashEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadProjects();
    setProjects(loaded);
    const storedActiveId = loadActiveProjectId();
    const validActiveId = loaded.some((p) => p.id === storedActiveId) ? storedActiveId : loaded[0]?.id ?? null;
    setActiveProjectIdState(validActiveId);

    // Auto-purge anything past the retention window — once per session load.
    const loadedTrash = purgeExpiredTrash(loadTrash());
    setTrash(loadedTrash);

    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveProjects(projects);
  }, [projects, ready]);

  useEffect(() => {
    if (ready) saveTrash(trash);
  }, [trash, ready]);

  const addTrashEntry = useCallback((entry: Omit<TrashEntry, "id" | "deletedAt">) => {
    setTrash((prev) => [{ ...entry, id: makeTrashId(), deletedAt: new Date().toISOString() }, ...prev]);
  }, []);

  const setActiveProjectId = useCallback((id: string | null) => {
    setActiveProjectIdState(id);
    saveActiveProjectId(id);
  }, []);

  const createProject = useCallback(
    (goal: string, milestones: RawMilestone[], deadline?: string, icon?: string, title?: string, rationale?: string) => {
      const id = createProjectId();
      const createdAt = new Date().toISOString();
      const resolvedDeadline = deadline ?? null;
      const project: Project = {
        id,
        name: title?.trim() || shortName(goal),
        goal,
        milestones: ensureMilestoneDateRanges(normalizeMilestones(milestones), createdAt, resolvedDeadline),
        createdAt,
        messages: [],
        streakCount: 0,
        lastActiveDate: null,
        celebrated: false,
        deadline: resolvedDeadline,
        deletedAt: null,
        recalibrationLastPromptedAt: null,
        recalibrationLog: [],
        aheadPaceLastPromptedAt: null,
        devSimulatedDriftDays: 0,
        notes: "",
        noteAttachments: [],
        icon: icon ?? null,
        planRationale: rationale?.trim() || null,
      };
      setProjects((prev) => [project, ...prev]);
      setActiveProjectId(id);
      return id;
    },
    [setActiveProjectId]
  );

  const deleteProject = useCallback(
    (id: string) => {
      const removed = projects.find((p) => p.id === id);
      if (removed) {
        addTrashEntry({ type: "project", projectId: removed.id, projectName: removed.name, data: removed });
      }
      const next = projects.filter((p) => p.id !== id);
      setProjects(next);
      if (activeProjectId === id) {
        setActiveProjectId(next[0]?.id ?? null);
      }
    },
    [activeProjectId, projects, setActiveProjectId, addTrashEntry]
  );

  const renameProject = useCallback((id: string, name: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, notes } : p)));
  }, []);

  const setProjectIcon = useCallback((id: string, icon: string | null) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, icon } : p)));
  }, []);

  const addNoteAttachment = useCallback((id: string, attachment: Attachment) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, noteAttachments: [...p.noteAttachments, attachment] } : p))
    );
  }, []);

  const removeNoteAttachment = useCallback((id: string, attachmentId: string) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, noteAttachments: p.noteAttachments.filter((a) => a.id !== attachmentId) } : p
      )
    );
  }, []);

  const toggleTask = useCallback((projectId: string, milestoneIndex: number, taskIndex: number) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;

        const isChecking = !p.milestones[milestoneIndex].tasks[taskIndex].completed;
        const streakUpdate = isChecking ? recordActivity(p) : undefined;

        return {
          ...p,
          ...streakUpdate,
          milestones: p.milestones.map((m, mi) =>
            mi !== milestoneIndex
              ? m
              : {
                  ...m,
                  tasks: m.tasks.map((t, ti) =>
                    ti !== taskIndex
                      ? t
                      : {
                          ...t,
                          completed: !t.completed,
                          completedAt: !t.completed ? new Date().toISOString() : null,
                        }
                  ),
                }
          ),
        };
      })
    );
  }, []);

  const addSubtask = useCallback(
    (projectId: string, milestoneIndex: number, taskIndex: number, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setProjects((prev) =>
        prev.map((p) =>
          p.id !== projectId
            ? p
            : {
                ...p,
                milestones: p.milestones.map((m, mi) =>
                  mi !== milestoneIndex
                    ? m
                    : {
                        ...m,
                        tasks: m.tasks.map((t, ti) =>
                          ti !== taskIndex
                            ? t
                            : {
                                ...t,
                                subtasks: [
                                  ...t.subtasks,
                                  { id: makeSubtaskId(), text: trimmed, completed: false },
                                ],
                              }
                        ),
                      }
                ),
              }
        )
      );
    },
    []
  );

  const toggleSubtask = useCallback(
    (projectId: string, milestoneIndex: number, taskIndex: number, subtaskId: string) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id !== projectId
            ? p
            : {
                ...p,
                milestones: p.milestones.map((m, mi) =>
                  mi !== milestoneIndex
                    ? m
                    : {
                        ...m,
                        tasks: m.tasks.map((t, ti) =>
                          ti !== taskIndex
                            ? t
                            : {
                                ...t,
                                subtasks: t.subtasks.map((s) =>
                                  s.id !== subtaskId ? s : { ...s, completed: !s.completed }
                                ),
                              }
                        ),
                      }
                ),
              }
        )
      );
    },
    []
  );

  /** Moves a task between Kanban columns. Only "done" affects the task's checkbox. */
  const moveTask = useCallback(
    (projectId: string, milestoneIndex: number, taskIndex: number, column: BoardColumn) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;

          const task = p.milestones[milestoneIndex].tasks[taskIndex];
          const nowDone = column === "done";
          const newlyChecked = !task.completed && nowDone;
          const streakUpdate = newlyChecked ? recordActivity(p) : undefined;

          return {
            ...p,
            ...streakUpdate,
            milestones: p.milestones.map((m, mi) =>
              mi !== milestoneIndex
                ? m
                : {
                    ...m,
                    tasks: m.tasks.map((t, ti) =>
                      ti !== taskIndex
                        ? t
                        : {
                            ...t,
                            completed: nowDone,
                            completedAt: nowDone ? new Date().toISOString() : null,
                            kanbanStatus: column === "done" ? t.kanbanStatus : (column as KanbanStatus),
                          }
                    ),
                  }
            ),
          };
        })
      );
    },
    []
  );

  const updateTaskText = useCallback((projectId: string, milestoneIndex: number, taskIndex: number, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== projectId
          ? p
          : {
              ...p,
              milestones: p.milestones.map((m, mi) =>
                mi !== milestoneIndex
                  ? m
                  : { ...m, tasks: m.tasks.map((t, ti) => (ti !== taskIndex ? t : { ...t, text: trimmed })) }
              ),
            }
      )
    );
  }, []);

  const addTask = useCallback((projectId: string, milestoneIndex: number, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== projectId
          ? p
          : {
              ...p,
              milestones: p.milestones.map((m, mi) =>
                mi !== milestoneIndex ? m : { ...m, tasks: [...m.tasks, normalizeTask({ text: trimmed })] }
              ),
            }
      )
    );
  }, []);

  const deleteTask = useCallback(
    (projectId: string, milestoneIndex: number, taskIndex: number) => {
      const project = projects.find((p) => p.id === projectId);
      const milestone = project?.milestones[milestoneIndex];
      const task = milestone?.tasks[taskIndex];
      if (project && milestone && task) {
        addTrashEntry({
          type: "task",
          projectId: project.id,
          projectName: project.name,
          milestoneId: milestone.id,
          milestoneTitle: milestone.title,
          data: task,
        });
      }
      setProjects((prev) =>
        prev.map((p) =>
          p.id !== projectId
            ? p
            : {
                ...p,
                milestones: p.milestones.map((m, mi) =>
                  mi !== milestoneIndex ? m : { ...m, tasks: m.tasks.filter((_, ti) => ti !== taskIndex) }
                ),
              }
        )
      );
    },
    [projects, addTrashEntry]
  );

  const reorderTasks = useCallback(
    (projectId: string, milestoneIndex: number, fromIndex: number, toIndex: number) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            milestones: p.milestones.map((m, mi) => {
              if (mi !== milestoneIndex) return m;
              const tasks = [...m.tasks];
              const [moved] = tasks.splice(fromIndex, 1);
              tasks.splice(toIndex, 0, moved);
              return { ...m, tasks };
            }),
          };
        })
      );
    },
    []
  );

  const updateMilestoneTitle = useCallback((projectId: string, milestoneIndex: number, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id !== projectId
          ? p
          : { ...p, milestones: p.milestones.map((m, mi) => (mi !== milestoneIndex ? m : { ...m, title: trimmed })) }
      )
    );
  }, []);

  const addMilestone = useCallback(
    (projectId: string, title: string, weekLabel: number, initialTaskTitles: string[] = []) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          const { startDate, endDate } = deriveSingleMilestoneDateRange(p.createdAt, weekLabel);
          const newMilestone: Milestone = {
            id: makeMilestoneId(),
            title: trimmedTitle,
            weekLabel,
            deadline: null,
            startDate,
            endDate,
            tasks: initialTaskTitles
              .map((t) => t.trim())
              .filter(Boolean)
              .map((text) => normalizeTask({ text })),
          };
          return { ...p, milestones: [...p.milestones, newMilestone] };
        })
      );
    },
    []
  );

  const deleteMilestone = useCallback(
    (projectId: string, milestoneIndex: number) => {
      const project = projects.find((p) => p.id === projectId);
      const milestone = project?.milestones[milestoneIndex];
      if (project && milestone) {
        addTrashEntry({ type: "milestone", projectId: project.id, projectName: project.name, data: milestone });
      }
      setProjects((prev) =>
        prev.map((p) =>
          p.id !== projectId ? p : { ...p, milestones: p.milestones.filter((_, mi) => mi !== milestoneIndex) }
        )
      );
    },
    [projects, addTrashEntry]
  );

  const reorderMilestones = useCallback((projectId: string, fromIndex: number, toIndex: number) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const milestones = [...p.milestones];
        const [moved] = milestones.splice(fromIndex, 1);
        milestones.splice(toIndex, 0, moved);
        return { ...p, milestones };
      })
    );
  }, []);

  const restoreTrashEntry = useCallback(
    (trashId: string): { ok: boolean; reason?: string } => {
      const entry = trash.find((e) => e.id === trashId);
      if (!entry) return { ok: false, reason: "That item is no longer in the trash." };

      if (entry.type === "project") {
        setProjects((prev) => [entry.data as Project, ...prev]);
        setTrash((prev) => prev.filter((e) => e.id !== trashId));
        return { ok: true };
      }

      const project = projects.find((p) => p.id === entry.projectId);
      if (!project) {
        return { ok: false, reason: "The project this belonged to is in trash — restore it first." };
      }

      if (entry.type === "milestone") {
        setProjects((prev) =>
          prev.map((p) =>
            p.id !== entry.projectId ? p : { ...p, milestones: [...p.milestones, entry.data as Milestone] }
          )
        );
        setTrash((prev) => prev.filter((e) => e.id !== trashId));
        return { ok: true };
      }

      // type === "task"
      const milestone = project.milestones.find((m) => m.id === entry.milestoneId);
      if (!milestone) {
        return { ok: false, reason: "The milestone this belonged to is in trash — restore it first." };
      }
      setProjects((prev) =>
        prev.map((p) =>
          p.id !== entry.projectId
            ? p
            : {
                ...p,
                milestones: p.milestones.map((m) =>
                  m.id !== entry.milestoneId ? m : { ...m, tasks: [...m.tasks, entry.data as Task] }
                ),
              }
        )
      );
      setTrash((prev) => prev.filter((e) => e.id !== trashId));
      return { ok: true };
    },
    [trash, projects]
  );

  const permanentlyDeleteTrashEntry = useCallback((trashId: string) => {
    setTrash((prev) => prev.filter((e) => e.id !== trashId));
  }, []);

  const emptyTrash = useCallback(() => {
    setTrash([]);
  }, []);

  const applyRecalibration = useCallback(
    (projectId: string, newMilestones: Milestone[], shiftDays: number, atRisk: boolean) => {
      const now = new Date().toISOString();
      setProjects((prev) =>
        prev.map((p) =>
          p.id !== projectId
            ? p
            : {
                ...p,
                milestones: newMilestones,
                recalibrationLastPromptedAt: now,
                recalibrationLog: [...p.recalibrationLog, { date: now, shiftDays, atRisk }],
              }
        )
      );
    },
    []
  );

  const dismissRecalibration = useCallback((projectId: string) => {
    const now = new Date().toISOString();
    setProjects((prev) => prev.map((p) => (p.id !== projectId ? p : { ...p, recalibrationLastPromptedAt: now })));
  }, []);

  // Ahead-of-pace banner's "pull my timeline forward" action — same shape as
  // applyRecalibration but logged/cooled-down independently (see
  // aheadPaceLastPromptedAt on Project) since it's a distinct signal.
  const applyAcceleration = useCallback((projectId: string, newMilestones: Milestone[]) => {
    const now = new Date().toISOString();
    setProjects((prev) =>
      prev.map((p) => (p.id !== projectId ? p : { ...p, milestones: newMilestones, aheadPaceLastPromptedAt: now }))
    );
  }, []);

  const dismissAheadOfPace = useCallback((projectId: string) => {
    const now = new Date().toISOString();
    setProjects((prev) => prev.map((p) => (p.id !== projectId ? p : { ...p, aheadPaceLastPromptedAt: now })));
  }, []);

  /**
   * Replaces one milestone's title/tasks in place — id, weekLabel, deadline,
   * and startDate/endDate are all preserved so its position, phase number,
   * and date range in the timeline don't move. The new tasks always start
   * unchecked (normalizeTask's default) since they're different tasks, not a
   * continuation of the old ones' progress.
   */
  const regenerateMilestone = useCallback((projectId: string, milestoneIndex: number, title: string, taskTexts: string[]) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const milestones = p.milestones.map((m, i) =>
          i !== milestoneIndex
            ? m
            : { ...m, title: title.trim() || m.title, tasks: taskTexts.map((text) => normalizeTask({ text })) }
        );
        return { ...p, milestones };
      })
    );
  }, []);

  const setDevSimulatedDrift = useCallback((projectId: string, days: number) => {
    setProjects((prev) => prev.map((p) => (p.id !== projectId ? p : { ...p, devSimulatedDriftDays: days })));
  }, []);

  const markCelebrated = useCallback((projectId: string) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, celebrated: true } : p)));
  }, []);

  const addChatMessage = useCallback((projectId: string, message: ChatMessage) => {
    setProjects((prev) =>
      prev.map((p) => (p.id !== projectId ? p : { ...p, messages: [...p.messages, message] }))
    );
  }, []);

  const clearAllProjects = useCallback(() => {
    setProjects([]);
    setActiveProjectId(null);
  }, [setActiveProjectId]);

  const replaceAllProjects = useCallback(
    (next: Project[]) => {
      setProjects(next);
      setActiveProjectId(next[0]?.id ?? null);
    },
    [setActiveProjectId]
  );

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  return {
    ready,
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    createProject,
    deleteProject,
    renameProject,
    toggleTask,
    addSubtask,
    toggleSubtask,
    moveTask,
    updateTaskText,
    addTask,
    deleteTask,
    reorderTasks,
    updateMilestoneTitle,
    addMilestone,
    deleteMilestone,
    reorderMilestones,
    markCelebrated,
    addChatMessage,
    clearAllProjects,
    replaceAllProjects,
    trash,
    restoreTrashEntry,
    permanentlyDeleteTrashEntry,
    emptyTrash,
    applyRecalibration,
    dismissRecalibration,
    applyAcceleration,
    dismissAheadOfPace,
    regenerateMilestone,
    setDevSimulatedDrift,
    updateNotes,
    setProjectIcon,
    addNoteAttachment,
    removeNoteAttachment,
  };
}
