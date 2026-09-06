// ---------------------------------------------------------------------------
// Canonical data model. This is the single source of truth for the shape of
// every persisted entity — components and hooks should import these types
// rather than declaring their own inline shapes.
//
// A few deliberate decisions from the schema audit, worth stating explicitly:
//
// 1. ORDER: Project/Milestone/Task do NOT have a stored `order` field. Array
//    position already fully and unambiguously encodes order, and every
//    reorder operation (reorderTasks, reorderMilestones) works by splicing
//    the array — so a parallel `order: number` field would be a second
//    source of truth that must be kept in sync by hand on every add/delete/
//    reorder. That's exactly the kind of drift this cleanup is meant to
//    remove, not reintroduce. If sparse/conflict-tolerant ordering is ever
//    needed (e.g. multi-client sync), revisit this — for a single-user
//    localStorage app it isn't.
//
// 2. MILESTONE STATUS: `MilestoneStatus` ("on_track" | "slipped" |
//    "completed") is NOT a stored field on Milestone. It's a pure function
//    of (project.createdAt, milestone.weekLabel/.deadline, milestone.tasks,
//    now) — see lib/milestones.ts. A stored field requires remembering to
//    recompute it at every call site that touches tasks, deadlines, or
//    recalibration; a computed value can't go stale because it's never
//    cached. This is the strongest possible reading of "recalculate
//    whenever relevant data changes."
//
// 3. TASK expectedDate is likewise derived, not stored — see
//    lib/milestones.ts's getMilestoneDeadline (tasks inherit their
//    milestone's expected date; there's no per-task scheduling in this app).
// ---------------------------------------------------------------------------

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

/** Which Kanban column a task sits in — independent of Milestone.status (see lib/milestones.ts), which is about schedule health, not workflow stage. */
export type KanbanStatus = "todo" | "in-progress";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  kanbanStatus: KanbanStatus;
  /** Set when the task is checked off, cleared on uncheck — the source of truth for the activity heatmap, weekly digest, and milestone status. */
  completedAt: string | null;
  subtasks: SubTask[];
}

/** Milestone.status is intentionally absent here — see file header, decision 2. Compute it with getMilestoneStatus(). */
export type MilestoneStatus = "on_track" | "slipped" | "completed";

export interface Milestone {
  id: string;
  title: string;
  /** Legacy pacing/ordering number, kept as a fallback for deriving dates before startDate/endDate exist and for internal signals (chat context, projected-completion math) — no longer shown in the UI, which displays startDate/endDate instead. */
  weekLabel: number;
  /** Explicit override for the milestone's deadline (end-of-range). Null (the common case) means "use endDate, or derive from project.createdAt + weekLabel if that's missing too" — see getMilestoneDeadline(). Set only if a milestone's date is manually adjusted independent of its computed range. */
  deadline: string | null;
  /** Real calendar date range this phase spans (ISO strings) — the source of truth for the "PHASE N OF M · <range>" label and Timeline's proportional spacing. Computed at generation/migration time from the project's actual timeline (deadline if set, else a default span) and each milestone's relative pacing; null only transiently before that pass runs. */
  startDate: string | null;
  endDate: string | null;
  tasks: Task[];
}

/** Pre-normalization shapes, for hand-authored or generated content that hasn't been assigned ids yet — see lib/tasks.ts's normalizeMilestones. */
/** A bare string is shorthand for a task with just that text — see normalizeTask in lib/tasks.ts for why this needs to be tolerated, not just the object shape. */
export type RawTask = (Partial<Task> & Pick<Task, "text">) | string;
export type RawMilestone = Partial<Omit<Milestone, "tasks">> &
  Pick<Milestone, "title" | "weekLabel"> & { tasks: RawTask[] };

export interface Roadmap {
  milestones: RawMilestone[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  /** base64 data: URL — this is a localStorage-only app, so files live inline rather than in a real object store. */
  dataUrl: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  attachments?: Attachment[];
}

export interface Project {
  id: string;
  name: string;
  goal: string;
  createdAt: string;
  deadline: string | null;
  milestones: Milestone[];
  messages: ChatMessage[];
  streakCount: number;
  lastActiveDate: string | null;
  celebrated: boolean;
  deletedAt: string | null;
  recalibrationLastPromptedAt: string | null;
  recalibrationLog: RecalibrationLogEntry[];
  /** Cooldown for the ahead-of-pace banner — separate from recalibrationLastPromptedAt since "you're behind" and "you're ahead" are independent signals that shouldn't suppress each other. */
  aheadPaceLastPromptedAt: string | null;
  /** Dev-only: shifts "now" forward this many days for drift detection, so recalibration can be demoed without waiting real time. Always 0 in production use. */
  devSimulatedDriftDays: number;
  notes: string;
  noteAttachments: Attachment[];
  icon: string | null;
  /** The model's 1-2 sentence explanation of why it structured the plan this way — null for mock-generated or pre-existing plans. Surfaced as an expandable "Why this plan" note. */
  planRationale: string | null;
}

export interface RecalibrationLogEntry {
  date: string;
  shiftDays: number;
  atRisk: boolean;
}

export type Tier = "bronze" | "gold" | "platinum";

/** Mock sign-in only — see hooks/useAuth.ts. Not a real auth session. */
export type AuthProvider = "google" | "apple" | "email";

export interface MockUser {
  name: string;
  email: string;
  provider: AuthProvider;
}

export type ViewMode = "checklist" | "board" | "timeline" | "notes";

/** Monthly AI token budget tracking — real Anthropic API calls only, never mock-generated content (see lib/tiers.ts). */
export interface TokenUsage {
  tokensUsed: number;
  resetDate: string;
}

export type TrashItemType = "project" | "milestone" | "task";

/**
 * Snapshots of soft-deleted items, kept in a separate list rather than
 * flagged in place — this way every existing render path over
 * project.milestones / milestone.tasks stays untouched, since deleted items
 * are genuinely removed from those live arrays the moment they're trashed.
 */
export interface TrashEntry {
  id: string;
  type: TrashItemType;
  deletedAt: string;
  projectId: string;
  projectName: string;
  milestoneId?: string;
  milestoneTitle?: string;
  data: Project | Milestone | Task;
}
