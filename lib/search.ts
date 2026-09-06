import { Project } from "./types";

export interface SearchResult {
  projectId: string;
  projectName: string;
  milestoneId: string;
  milestoneTitle: string;
  /** Present when the match was a task's text; absent when the milestone title itself matched. */
  taskTitle?: string;
}

const MAX_RESULTS = 20;

/** Case-insensitive substring search across every project's milestone titles and task text. */
export function searchProjects(projects: Project[], query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  outer: for (const p of projects) {
    for (const m of p.milestones) {
      if (m.title.toLowerCase().includes(q)) {
        results.push({ projectId: p.id, projectName: p.name, milestoneId: m.id, milestoneTitle: m.title });
        if (results.length >= MAX_RESULTS) break outer;
      }
      for (const t of m.tasks) {
        if (t.text.toLowerCase().includes(q)) {
          results.push({
            projectId: p.id,
            projectName: p.name,
            milestoneId: m.id,
            milestoneTitle: m.title,
            taskTitle: t.text,
          });
          if (results.length >= MAX_RESULTS) break outer;
        }
      }
    }
  }

  return results;
}
