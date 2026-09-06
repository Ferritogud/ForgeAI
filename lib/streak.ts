import { Project } from "./types";

/** Local (not UTC) YYYY-MM-DD so the streak resets at the user's own midnight. */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

type StreakFields = Pick<Project, "streakCount" | "lastActiveDate">;

/**
 * Called whenever the user checks off a task (not on uncheck). Multiple
 * check-offs on the same day don't double count; a missed day resets to 1
 * on the next active day instead of continuing the old streak.
 */
export function recordActivity(project: StreakFields, now: Date = new Date()): StreakFields {
  const today = dateKey(now);
  if (project.lastActiveDate === today) {
    return project;
  }

  const yesterday = dateKey(addDays(now, -1));
  const continuing = project.lastActiveDate === yesterday;

  return {
    streakCount: continuing ? project.streakCount + 1 : 1,
    lastActiveDate: today,
  };
}
