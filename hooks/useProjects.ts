"use client";

import { useCallback, useEffect, useState } from "react";
import { Milestone, Project } from "@/lib/types";
import {
  createProjectId,
  loadActiveProjectId,
  loadProjects,
  saveActiveProjectId,
  saveProjects,
  shortName,
} from "@/lib/storage";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadProjects();
    setProjects(loaded);
    const storedActiveId = loadActiveProjectId();
    const validActiveId = loaded.some((p) => p.id === storedActiveId) ? storedActiveId : loaded[0]?.id ?? null;
    setActiveProjectIdState(validActiveId);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveProjects(projects);
  }, [projects, ready]);

  const setActiveProjectId = useCallback((id: string | null) => {
    setActiveProjectIdState(id);
    saveActiveProjectId(id);
  }, []);

  const createProject = useCallback(
    (goal: string, milestones: Milestone[]) => {
      const id = createProjectId();
      const project: Project = {
        id,
        name: shortName(goal),
        goal,
        milestones,
        createdAt: new Date().toISOString(),
      };
      setProjects((prev) => [project, ...prev]);
      setActiveProjectId(id);
      return id;
    },
    [setActiveProjectId]
  );

  const deleteProject = useCallback(
    (id: string) => {
      const next = projects.filter((p) => p.id !== id);
      setProjects(next);
      if (activeProjectId === id) {
        setActiveProjectId(next[0]?.id ?? null);
      }
    },
    [activeProjectId, projects, setActiveProjectId]
  );

  const renameProject = useCallback((id: string, name: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
  }, []);

  const toggleTask = useCallback((projectId: string, milestoneIndex: number, taskIndex: number) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          milestones: p.milestones.map((m, mi) =>
            mi !== milestoneIndex
              ? m
              : {
                  ...m,
                  tasks: m.tasks.map((t, ti) => (ti !== taskIndex ? t : { ...t, done: !t.done })),
                }
          ),
        };
      })
    );
  }, []);

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
  };
}
