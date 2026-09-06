import { Project } from "./types";
import { dateKey } from "./streak";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS_BACK = 13; // ~3 months, GitHub-style window

export interface HeatmapDay {
  date: Date;
  dateKey: string;
  count: number;
  /** False for padding cells before the project existed / after today. */
  inRange: boolean;
}

export interface HeatmapData {
  /** Each week is 7 days, Sunday first, columns left-to-right oldest-to-newest. */
  weeks: HeatmapDay[][];
  monthLabels: { weekIndex: number; label: string }[];
  maxCount: number;
}

/** Buckets a day's count into a 0-4 intensity level for coloring, relative to the busiest day shown. */
export function intensityLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (maxCount <= 1) return 4;
  const ratio = count / maxCount;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

/** Builds a GitHub-contributions-style grid from a project's task completion dates. */
export function buildHeatmap(project: Pick<Project, "milestones" | "createdAt">, now: Date = new Date()): HeatmapData {
  const counts = new Map<string, number>();
  for (const m of project.milestones) {
    for (const t of m.tasks) {
      if (!t.completedAt) continue;
      const key = dateKey(new Date(t.completedAt));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const earliestPossible = new Date(today.getTime() - WEEKS_BACK * 7 * DAY_MS);
  const created = new Date(project.createdAt);
  const createdDay = new Date(created.getFullYear(), created.getMonth(), created.getDate());
  const rangeStart = createdDay > earliestPossible ? createdDay : earliestPossible;

  // Align the grid to a Sunday so rows line up like GitHub's graph.
  const gridStart = new Date(rangeStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const totalDays = Math.round((today.getTime() - gridStart.getTime()) / DAY_MS) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);

  const weeks: HeatmapDay[][] = [];
  const monthLabels: { weekIndex: number; label: string }[] = [];
  let lastMonth = -1;
  let maxCount = 0;

  for (let w = 0; w < totalWeeks; w++) {
    const week: HeatmapDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(gridStart.getTime() + (w * 7 + d) * DAY_MS);
      const key = dateKey(date);
      const count = counts.get(key) ?? 0;
      const inRange = date >= rangeStart && date <= today;
      if (inRange) maxCount = Math.max(maxCount, count);
      week.push({ date, dateKey: key, count, inRange });

      if (d === 0 && date.getMonth() !== lastMonth && date >= rangeStart) {
        lastMonth = date.getMonth();
        monthLabels.push({ weekIndex: w, label: date.toLocaleDateString("en-US", { month: "short" }) });
      }
    }
    weeks.push(week);
  }

  return { weeks, monthLabels, maxCount };
}
