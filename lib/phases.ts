import { Milestone } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Turns each milestone's weekLabel into a real calendar date range, scaled
 * onto the project's actual available time (its deadline if one exists,
 * else a flat totalWeeks*7-day span) rather than a literal "week N" offset.
 *
 * The relative WIDTH of each phase comes from the weekLabel gap over the
 * previous milestone in array order, not from a fixed per-milestone width —
 * this is what lets phases come out different lengths (a 3-week gap becomes
 * a wider phase than a 1-week gap) instead of forcing every phase to the
 * same duration. A non-positive gap (an out-of-order weekLabel, e.g. after a
 * manual edit) still gets a small positive weight so that phase never
 * collapses to zero width.
 */
export function computeMilestoneDateRanges(
  createdAtIso: string,
  deadlineIso: string | null,
  milestones: { weekLabel: number }[]
): { startDate: string; endDate: string }[] {
  if (milestones.length === 0) return [];

  const createdAt = new Date(createdAtIso);

  const weights: number[] = [];
  let prevWeek = 0;
  for (const m of milestones) {
    weights.push(Math.max(0.5, m.weekLabel - prevWeek));
    prevWeek = m.weekLabel;
  }
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const totalWeeks = Math.max(1, ...milestones.map((m) => m.weekLabel));
  const totalDays = deadlineIso
    ? Math.max(totalWeeks, Math.round((new Date(`${deadlineIso}T00:00:00`).getTime() - createdAt.getTime()) / DAY_MS))
    : totalWeeks * 7;

  let cursorDays = 0;
  return weights.map((w) => {
    const start = new Date(createdAt.getTime() + cursorDays * DAY_MS);
    cursorDays += (w / totalWeight) * totalDays;
    const end = new Date(createdAt.getTime() + cursorDays * DAY_MS);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  });
}

/**
 * Backfills startDate/endDate on any milestone missing them — the single
 * choke point used both right after generation (brand-new milestones never
 * have dates yet) and at load time for projects saved before this field
 * existed (see normalizeProject in lib/storage.ts). A no-op once every
 * milestone already has real dates.
 */
export function ensureMilestoneDateRanges(
  milestones: Milestone[],
  createdAtIso: string,
  deadlineIso: string | null
): Milestone[] {
  if (milestones.every((m) => m.startDate && m.endDate)) return milestones;
  const ranges = computeMilestoneDateRanges(createdAtIso, deadlineIso, milestones);
  return milestones.map((m, i) =>
    m.startDate && m.endDate ? m : { ...m, startDate: ranges[i].startDate, endDate: ranges[i].endDate }
  );
}

/** Date range for a single freshly-added milestone (e.g. from AddMilestoneCard), independent of its siblings — a plain one-week span ending at its weekLabel, same shape the old single-week model implied. */
export function deriveSingleMilestoneDateRange(
  createdAtIso: string,
  weekLabel: number
): { startDate: string; endDate: string } {
  const createdAt = new Date(createdAtIso);
  const start = new Date(createdAt.getTime() + Math.max(0, weekLabel - 1) * 7 * DAY_MS);
  const end = new Date(createdAt.getTime() + weekLabel * 7 * DAY_MS);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

/** Compact "Aug 30 – Sep 12" phase label — includes the year only when the range crosses a year boundary or falls outside the current year, since this is a label, not a full date stamp. */
export function formatPhaseRange(startIso: string, endIso: string, now: Date = new Date()): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const includeYear = start.getFullYear() !== now.getFullYear() || end.getFullYear() !== start.getFullYear();
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  };
  return `${start.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
}
