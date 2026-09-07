import { MockUser, Project, Tier, TokenUsage, TrashEntry, ViewMode } from "./types";
import { normalizeMilestones } from "./tasks";
import { ensureMilestoneDateRanges } from "./phases";

const PROJECTS_KEY = "forgeai_projects";
const ACTIVE_ID_KEY = "forgeai_active_project_id";
const LEGACY_KEY = "forgeai_plan";
const TIER_KEY = "forgeai_tier";
const TOKEN_USAGE_KEY = "forgeai_token_usage";
const VIEW_MODE_KEY = "forgeai_view_mode";
const TRASH_KEY = "forgeai_trash";
const MOCK_USER_KEY = "forgeai_mock_user";
const SIDEBAR_WIDTH_KEY = "forgeai_sidebar_width";

export const SIDEBAR_MIN_WIDTH = 220;
export const SIDEBAR_MAX_WIDTH = 420;
const SIDEBAR_DEFAULT_WIDTH = 272;

function makeId(): string {
  return `proj_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function shortName(goal: string): string {
  const trimmed = goal.trim();
  return trimmed.length > 42 ? `${trimmed.slice(0, 42).trimEnd()}…` : trimmed;
}

/** Backfills fields added after some projects were already saved to localStorage. */
function normalizeProject(p: Project): Project {
  const allTasks = (p.milestones ?? []).flatMap((m) => m.tasks);
  // Raw localStorage data may still be pre-migration at this point (this
  // runs before normalizeMilestones below), so accept both field names.
  const allTasksLegacy = allTasks as unknown as { done?: boolean; completed?: boolean }[];
  const alreadyComplete =
    allTasksLegacy.length > 0 && allTasksLegacy.every((t) => t.completed ?? t.done ?? false);

  const createdAt = p.createdAt ?? new Date().toISOString();
  const deadline = p.deadline ?? null;

  return {
    ...p,
    milestones: ensureMilestoneDateRanges(normalizeMilestones(p.milestones ?? []), createdAt, deadline),
    createdAt,
    messages: p.messages ?? [],
    streakCount: p.streakCount ?? 0,
    lastActiveDate: p.lastActiveDate ?? null,
    // Projects that were already finished before this feature shipped
    // shouldn't suddenly trigger a celebration the next time they're opened.
    celebrated: p.celebrated ?? alreadyComplete,
    deadline: p.deadline ?? null,
    deletedAt: p.deletedAt ?? null,
    recalibrationLastPromptedAt: p.recalibrationLastPromptedAt ?? null,
    recalibrationLog: p.recalibrationLog ?? [],
    aheadPaceLastPromptedAt: p.aheadPaceLastPromptedAt ?? null,
    devSimulatedDriftDays: p.devSimulatedDriftDays ?? 0,
    notes: p.notes ?? "",
    noteAttachments: p.noteAttachments ?? [],
    icon: p.icon ?? null,
    planRationale: p.planRationale ?? null,
  };
}

/** Reads projects, migrating the old single-plan format on first run. */
export function loadProjects(): Project[] {
  const raw = localStorage.getItem(PROJECTS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeProject);
    } catch {
      // fall through to legacy migration
    }
  }

  const legacyRaw = localStorage.getItem(LEGACY_KEY);
  if (legacyRaw) {
    try {
      const legacy = JSON.parse(legacyRaw);
      const migrated: Project = normalizeProject({
        id: makeId(),
        name: shortName(legacy.goal ?? "Untitled Project"),
        goal: legacy.goal ?? "",
        milestones: legacy.roadmap?.milestones ?? [],
        createdAt: legacy.createdAt ?? new Date().toISOString(),
        messages: [],
        streakCount: 0,
        lastActiveDate: null,
        celebrated: false,
        deadline: null,
        deletedAt: null,
        recalibrationLastPromptedAt: null,
        recalibrationLog: [],
        aheadPaceLastPromptedAt: null,
        devSimulatedDriftDays: 0,
        notes: "",
        noteAttachments: [],
        icon: null,
        planRationale: null,
      });
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

export function loadTier(): Tier {
  const raw = localStorage.getItem(TIER_KEY);
  return raw === "gold" || raw === "platinum" ? raw : "bronze";
}

// TODO: replace with real Stripe checkout when ready — this just flips a local flag.
export function saveTier(tier: Tier) {
  localStorage.setItem(TIER_KEY, tier);
}

function nextMonthStart(from: Date): string {
  return new Date(from.getFullYear(), from.getMonth() + 1, 1).toISOString();
}

/** Reads the monthly AI token counter, resetting it if the reset date has passed. */
export function loadTokenUsage(): TokenUsage {
  const now = new Date();
  const raw = localStorage.getItem(TOKEN_USAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as TokenUsage;
      if (parsed.resetDate && new Date(parsed.resetDate) > now) {
        return parsed;
      }
    } catch {
      // fall through to a fresh usage record
    }
  }

  const fresh: TokenUsage = { tokensUsed: 0, resetDate: nextMonthStart(now) };
  saveTokenUsage(fresh);
  return fresh;
}

export function saveTokenUsage(usage: TokenUsage) {
  localStorage.setItem(TOKEN_USAGE_KEY, JSON.stringify(usage));
}

// View mode is remembered globally rather than per project — simpler, and
// covers the common case of a user having one workflow preference overall.
export function loadViewMode(): ViewMode {
  const raw = localStorage.getItem(VIEW_MODE_KEY);
  return raw === "board" || raw === "timeline" || raw === "notes" ? raw : "checklist";
}

export function saveViewMode(mode: ViewMode) {
  localStorage.setItem(VIEW_MODE_KEY, mode);
}

export function loadTrash(): TrashEntry[] {
  const raw = localStorage.getItem(TRASH_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTrash(entries: TrashEntry[]) {
  localStorage.setItem(TRASH_KEY, JSON.stringify(entries));
}

/**
 * Mock sign-in state only — separate from project data on purpose, so
 * signing out (or switching mock providers) never touches a user's
 * projects. See hooks/useAuth.ts.
 */
export function loadMockUser(): MockUser | null {
  const raw = localStorage.getItem(MOCK_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MockUser;
  } catch {
    return null;
  }
}

export function saveMockUser(user: MockUser) {
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
}

export function clearMockUser() {
  localStorage.removeItem(MOCK_USER_KEY);
}

export function loadSidebarWidth(): number {
  const raw = localStorage.getItem(SIDEBAR_WIDTH_KEY);
  const parsed = raw ? Number(raw) : NaN;
  if (Number.isFinite(parsed)) return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, parsed));
  return SIDEBAR_DEFAULT_WIDTH;
}

export function saveSidebarWidth(width: number) {
  localStorage.setItem(SIDEBAR_WIDTH_KEY, String(width));
}

const TASK_GUIDANCE_KEY = "forgeai_task_guidance";

interface TaskGuidanceEntry {
  summary: string;
  steps: string[];
  generatedAt: string;
}

type TaskGuidanceCache = Record<string, TaskGuidanceEntry>;

function readTaskGuidanceCache(): TaskGuidanceCache {
  const raw = localStorage.getItem(TASK_GUIDANCE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as TaskGuidanceCache;
  } catch {
    return {};
  }
}

/**
 * Cached per task.id, not tied to any one project — this is disposable,
 * regenerate-on-demand guidance, not core plan data, so it deliberately
 * lives outside Project/localStorage export-import rather than in the data
 * model proper.
 */
export function loadTaskGuidance(taskId: string): TaskGuidanceEntry | null {
  return readTaskGuidanceCache()[taskId] ?? null;
}

export function saveTaskGuidance(taskId: string, summary: string, steps: string[]) {
  const cache = readTaskGuidanceCache();
  cache[taskId] = { summary, steps, generatedAt: new Date().toISOString() };
  localStorage.setItem(TASK_GUIDANCE_KEY, JSON.stringify(cache));
}
