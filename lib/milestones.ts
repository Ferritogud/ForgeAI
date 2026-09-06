import { Milestone, MilestoneStatus, Project } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Grace period before a past-due milestone counts as "slipped" — avoids
 * flagging a milestone the instant its deadline ticks over. This is the one
 * threshold both the status computation and recalibration's drift detection
 * share, replacing the two separate (and inconsistent) 3-day/5-day grace
 * periods that used to live only inside recalibration.ts.
 */
export const SLIP_GRACE_DAYS = 3;

/** The calendar date a milestone's tasks are expected to be done by. Explicit `milestone.deadline` wins if set; otherwise the end of its real date range (endDate); otherwise (pre-migration/generation) derived from the project's start date + weekLabel. */
export function getMilestoneDeadline(
  project: Pick<Project, "createdAt">,
  milestone: Pick<Milestone, "weekLabel" | "deadline" | "endDate">
): Date {
  if (milestone.deadline) return new Date(milestone.deadline);
  if (milestone.endDate) return new Date(milestone.endDate);
  return new Date(new Date(project.createdAt).getTime() + milestone.weekLabel * 7 * DAY_MS);
}

/** The real start/end date range a milestone spans — falls back to a one-week span ending at getMilestoneDeadline() if startDate/endDate haven't been computed yet. */
export function getMilestoneDateRange(
  project: Pick<Project, "createdAt">,
  milestone: Pick<Milestone, "weekLabel" | "deadline" | "startDate" | "endDate">
): { start: Date; end: Date } {
  if (milestone.startDate && milestone.endDate) {
    return { start: new Date(milestone.startDate), end: new Date(milestone.endDate) };
  }
  const end = getMilestoneDeadline(project, milestone);
  return { start: new Date(end.getTime() - 7 * DAY_MS), end };
}

export function isMilestoneComplete(milestone: Pick<Milestone, "tasks">): boolean {
  return milestone.tasks.length > 0 && milestone.tasks.every((t) => t.completed);
}

/**
 * The single source of truth for a milestone's schedule health. Always
 * computed fresh, never stored — see the "Milestone status" note at the top
 * of lib/types.ts for why.
 */
export function getMilestoneStatus(
  project: Pick<Project, "createdAt">,
  milestone: Milestone,
  now: Date = new Date()
): MilestoneStatus {
  if (isMilestoneComplete(milestone)) return "completed";
  const deadline = getMilestoneDeadline(project, milestone);
  const daysPastDeadline = (now.getTime() - deadline.getTime()) / DAY_MS;
  if (daysPastDeadline > SLIP_GRACE_DAYS) return "slipped";
  return "on_track";
}

/** Tasks inherit their milestone's expected date — there's no independent per-task scheduling in this app. */
export function getTaskExpectedDate(
  project: Pick<Project, "createdAt">,
  milestone: Pick<Milestone, "weekLabel" | "deadline" | "endDate">
): Date {
  return getMilestoneDeadline(project, milestone);
}
