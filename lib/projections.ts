import { Project } from "./types";
import { getMilestoneDateRange } from "./milestones";

export type Trend = "ahead" | "on-track" | "behind" | "complete" | "unknown";

export interface ProjectionResult {
  trend: Trend;
  label: string;
  doneCount: number;
  total: number;
}

type ProjectionInput = Pick<Project, "goal" | "milestones" | "createdAt">;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Shared pace-projection math used by both the dashboard panel and the chat mock. */
export function computeProjection(project: ProjectionInput, percent: number, nowDate: Date = new Date()): ProjectionResult {
  const allTasks = project.milestones.flatMap((m) => m.tasks);
  const doneCount = allTasks.filter((t) => t.completed).length;
  const total = allTasks.length;

  const created = new Date(project.createdAt).getTime();
  const now = nowDate.getTime();
  const daysElapsed = Math.max(1, (now - created) / DAY_MS);

  const plannedCompletion =
    project.milestones.length > 0
      ? Math.max(...project.milestones.map((m) => getMilestoneDateRange(project, m).end.getTime()))
      : created + 7 * DAY_MS;

  if (percent >= 100) {
    return { trend: "complete", label: "Mission complete", doneCount, total };
  }

  if (doneCount === 0) {
    return { trend: "unknown", label: "Awaiting first task", doneCount, total };
  }

  const rate = doneCount / daysElapsed;
  const remaining = total - doneCount;
  const projectedDaysRemaining = remaining / rate;
  const projectedCompletion = now + projectedDaysRemaining * DAY_MS;
  const diff = projectedCompletion - plannedCompletion;

  let trend: Trend = "on-track";
  if (diff < -3 * DAY_MS) trend = "ahead";
  else if (diff > 3 * DAY_MS) trend = "behind";

  const label = new Date(projectedCompletion).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return { trend, label, doneCount, total };
}
