import { Project } from "./types";
import { computeProjection, Trend } from "./projections";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface WeeklyDigest {
  tasksCompletedThisWeek: number;
  trend: Trend;
  projectionLabel: string;
  streakCount: number;
  milestonesWorkedOn: string[];
  closingLine: string;
}

export function computeWeeklyDigest(project: Project, now: Date = new Date()): WeeklyDigest {
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const allTasks = project.milestones.flatMap((m) => m.tasks);

  const completedThisWeek = allTasks.filter((t) => {
    if (!t.completedAt) return false;
    const completed = new Date(t.completedAt);
    return completed >= weekAgo && completed <= now;
  });

  const milestonesWorkedOn = project.milestones
    .filter((m) =>
      m.tasks.some((t) => t.completedAt && new Date(t.completedAt) >= weekAgo && new Date(t.completedAt) <= now)
    )
    .map((m) => m.title);

  const doneCount = allTasks.filter((t) => t.completed).length;
  const percent = allTasks.length > 0 ? (doneCount / allTasks.length) * 100 : 0;
  const { trend, label } = computeProjection(project, percent, now);

  const tasksCompletedThisWeek = completedThisWeek.length;

  let closingLine: string;
  if (trend === "complete") {
    closingLine = "Mission complete — nothing left to do but start your next one.";
  } else if (tasksCompletedThisWeek === 0) {
    closingLine = "No tasks completed this week — pick one small thing and knock it out today.";
  } else if (trend === "ahead") {
    closingLine = "Strong week — keep this pace and you'll finish ahead of schedule.";
  } else if (trend === "behind") {
    closingLine = "Slower week than usual — a small push over the next few days gets you back on track.";
  } else {
    closingLine = "Solid week — keep this pace and you'll hit your target on schedule.";
  }

  return {
    tasksCompletedThisWeek,
    trend,
    projectionLabel: label,
    streakCount: project.streakCount,
    milestonesWorkedOn,
    closingLine,
  };
}
