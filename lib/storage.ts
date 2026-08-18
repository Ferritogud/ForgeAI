import { Project } from "./types";

const PROJECTS_KEY = "forgeai_projects";
const ACTIVE_ID_KEY = "forgeai_active_project_id";
const LEGACY_KEY = "forgeai_plan";

function makeId(): string {
  return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function shortName(goal: string): string {
  const trimmed = goal.trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 42).trimEnd()}…` : trimmed;
}

/** Reads projects, migrating the old single-plan format on first run. */
export function loadProjects(): Project[] {
  const raw = localStorage.getItem(PROJECTS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // fall through to legacy migration
    }
  }

  const legacyRaw = localStorage.getItem(LEGACY_KEY);
  if (legacyRaw) {
    try {
      const legacy = JSON.parse(legacyRaw);
      const migrated: Project = {
        id: makeId(),
        name: shortName(legacy.goal ?? "Untitled Project"),
        goal: legacy.goal ?? "",
        milestones: legacy.roadmap?.milestones ?? [],
        createdAt: legacy.createdAt ?? new Date().toISOString(),
      };
      saveProjects([migrated]);
      saveActiveProjectId(migrated.id);
      localStorage.removeItem(LEGACY_KEY);
      return [migrated];
    } catch {
      // ignore corrupt legacy data
    }
  }

  return [];
}

export function saveProjects(projects: Project[]) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function loadActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_ID_KEY);
}

export function saveActiveProjectId(id: string | null) {
  if (id) localStorage.setItem(ACTIVE_ID_KEY, id);
  else localStorage.removeItem(ACTIVE_ID_KEY);
}

export function createProjectId(): string {
  return makeId();
}
