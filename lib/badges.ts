export type BadgeId =
  | "fresh-start"
  | "first-task"
  | "editor"
  | "milestone-master"
  | "streak-3"
  | "streak-7"
  | "mission-complete";

export interface BadgeDef {
  id: BadgeId;
  label: string;
  description: string;
  icon: string;
}

export interface EarnedBadge {
  id: BadgeId;
  earnedAt: string;
}

/** Global, per-user achievements — not scoped to any one project. */
export const BADGE_DEFS: BadgeDef[] = [
  { id: "fresh-start", label: "Fresh Start", description: "Create your first project", icon: "🌱" },
  { id: "first-task", label: "First Steps", description: "Complete your first task", icon: "👣" },
  { id: "editor", label: "Editor", description: "Manually edit or add a task", icon: "✍️" },
  { id: "milestone-master", label: "Milestone Master", description: "Complete a full milestone", icon: "🏁" },
  { id: "streak-3", label: "3-Day Streak", description: "Stay active 3 days in a row", icon: "🔥" },
  { id: "streak-7", label: "7-Day Streak", description: "Stay active 7 days in a row", icon: "🔥" },
  { id: "mission-complete", label: "Mission Complete", description: "Finish a project at 100%", icon: "🏆" },
];
