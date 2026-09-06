import { Milestone, Project } from "./types";
import { getMilestoneDateRange, getMilestoneStatus, isMilestoneComplete, SLIP_GRACE_DAYS } from "./milestones";

/** After the user dismisses a proposal, don't prompt again for this many days. */
export const RE_PROMPT_COOLDOWN_DAYS = 4;
/**
 * Dev-only "simulate drift" button in Settings shifts time forward by this
 * many days. Large enough to push even a brand-new project's Milestone 1
 * (due at the end of week 1) past getMilestoneStatus's slip-grace window,
 * so the demo works regardless of when the project was created.
 */
export const DEV_SIMULATE_DRIFT_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface DriftReport {
  hasDrift: boolean;
  /** Indexes of milestones whose status is "slipped" — see getMilestoneStatus in lib/milestones.ts. */
  slippedMilestoneIndexes: number[];
  /** Average days past deadline across the slipped milestones — the basis for the proposed shift. */
  avgDaysBehind: number;
}

type RecalibrationInput = Pick<Project, "createdAt" | "milestones" | "deadline">;

/**
 * Pure drift detection. The trigger is simply "does any milestone's status
 * read as slipped" — getMilestoneStatus (lib/milestones.ts) is the single
 * place that decides what counts as late, so this function doesn't
 * re-derive overdue-ness from tasks/dates itself.
 */
export function detectDrift(project: Pick<Project, "createdAt" | "milestones">, now: Date = new Date()): DriftReport {
  const slippedMilestoneIndexes: number[] = [];
  const daysPastDeadline: number[] = [];

  project.milestones.forEach((m, mi) => {
    if (getMilestoneStatus(project, m, now) !== "slipped") return;
    slippedMilestoneIndexes.push(mi);
    const { end } = getMilestoneDateRange(project, m);
    daysPastDeadline.push((now.getTime() - end.getTime()) / DAY_MS);
  });

  const avgDaysBehind =
    daysPastDeadline.length > 0 ? daysPastDeadline.reduce((sum, d) => sum + d, 0) / daysPastDeadline.length : 0;

  return { hasDrift: slippedMilestoneIndexes.length > 0, slippedMilestoneIndexes, avgDaysBehind };
}

export interface MilestoneShift {
  index: number;
  title: string;
  fromRange: { startDate: string; endDate: string };
  toRange: { startDate: string; endDate: string };
}

export interface RecalibrationProposal {
  /** True when even shifting by the drift amount would blow past the deadline, so remaining milestones were compressed instead. */
  atRisk: boolean;
  shiftDays: number;
  milestoneShifts: MilestoneShift[];
  newMilestones: Milestone[];
}

/**
 * Computes a proposed new schedule from the project's current state. Pure —
 * takes state in, returns a proposal out, never mutates anything.
 */
/** Recomputes weekLabel from a milestone's (possibly shifted) endDate, purely so older readers that still key off weekLabel (chat context, projections' plannedWeeks) stay roughly consistent — the date range, not weekLabel, is the source of truth going forward. */
function weekLabelFromEnd(createdAt: Date, end: Date): number {
  return Math.max(1, Math.round((end.getTime() - createdAt.getTime()) / (7 * DAY_MS)));
}

export function proposeRecalibration(project: RecalibrationInput, now: Date = new Date()): RecalibrationProposal | null {
  const drift = detectDrift(project, now);
  if (!drift.hasDrift) return null;

  const createdAt = new Date(project.createdAt);
  const shiftDays = Math.max(1, Math.round(drift.avgDaysBehind));

  const shiftRange = (m: Milestone): Milestone => {
    if (isMilestoneComplete(m)) return m;
    const { start, end } = getMilestoneDateRange(project, m);
    const newStart = new Date(start.getTime() + shiftDays * DAY_MS);
    const newEnd = new Date(end.getTime() + shiftDays * DAY_MS);
    return {
      ...m,
      startDate: newStart.toISOString(),
      endDate: newEnd.toISOString(),
      weekLabel: weekLabelFromEnd(createdAt, newEnd),
    };
  };

  let newMilestones: Milestone[] = project.milestones.map(shiftRange);
  let atRisk = false;

  if (project.deadline) {
    const deadlineDate = new Date(`${project.deadline}T00:00:00`);
    const maxNewEnd = Math.max(...newMilestones.map((m) => getMilestoneDateRange(project, m).end.getTime()));

    if (maxNewEnd > deadlineDate.getTime()) {
      atRisk = true;

      const completedEnds = project.milestones
        .filter(isMilestoneComplete)
        .map((m) => getMilestoneDateRange(project, m).end.getTime());
      // Everything still to do gets compressed into the window from "now" (or
      // the last completed phase's end, whichever is later) through the
      // deadline — linearly rescaling each incomplete milestone's original
      // start/end offset into that shrunk window, so order and relative
      // duration are preserved even though everything gets tighter.
      const startWindow = Math.max(now.getTime(), createdAt.getTime(), ...completedEnds, 0);

      const incomplete = project.milestones.filter((m) => !isMilestoneComplete(m));
      const originalMaxEnd = Math.max(
        startWindow + DAY_MS,
        ...incomplete.map((m) => getMilestoneDateRange(project, m).end.getTime())
      );
      const originalSpan = Math.max(DAY_MS, originalMaxEnd - startWindow);
      const availableSpan = Math.max(DAY_MS, deadlineDate.getTime() - startWindow);

      const compress = (t: number) => startWindow + (Math.max(0, t - startWindow) / originalSpan) * availableSpan;

      newMilestones = project.milestones.map((m) => {
        if (isMilestoneComplete(m)) return m;
        const { start, end } = getMilestoneDateRange(project, m);
        const newStart = new Date(compress(start.getTime()));
        // A milestone whose original slot was entirely before startWindow
        // (i.e. already overdue once shifted) would otherwise compress to a
        // zero-width instant — floor it to at least one day so it still
        // reads as a real phase, not a single dateless point.
        const newEnd = new Date(Math.max(compress(end.getTime()), newStart.getTime() + DAY_MS));
        return {
          ...m,
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
          weekLabel: weekLabelFromEnd(createdAt, newEnd),
        };
      });
    }
  }

  const milestoneShifts: MilestoneShift[] = project.milestones
    .map((m, i) => {
      const from = getMilestoneDateRange(project, m);
      const to = getMilestoneDateRange(project, newMilestones[i]);
      return {
        index: i,
        title: m.title,
        fromRange: { startDate: from.start.toISOString(), endDate: from.end.toISOString() },
        toRange: { startDate: to.start.toISOString(), endDate: to.end.toISOString() },
      };
    })
    .filter((s) => s.fromRange.endDate !== s.toRange.endDate);

  if (milestoneShifts.length === 0) return null;

  return { atRisk, shiftDays, milestoneShifts, newMilestones };
}

// ---------------------------------------------------------------------------
// Ahead-of-pace detection — the mirror image of drift detection above: not
// "you're behind," but "you're consistently finishing early." Deliberately
// symmetric with SLIP_GRACE_DAYS (imported as-is, same threshold) so "ahead"
// and "behind" mean the same magnitude of schedule deviation either way.
// ---------------------------------------------------------------------------
export const AHEAD_GRACE_DAYS = SLIP_GRACE_DAYS;
/** Needs at least this many consecutive early-finished milestones (not just one lucky week) before it counts as a real pattern worth surfacing. */
export const AHEAD_STREAK_MIN = 2;

export interface AheadOfPaceReport {
  isAhead: boolean;
  /** How many milestones, counting from the start of the plan, were each finished at least AHEAD_GRACE_DAYS before their expected date — the run breaks at the first milestone that's either incomplete or wasn't meaningfully early. */
  streakCount: number;
  avgDaysAhead: number;
}

/** A milestone's actual completion date — the latest task.completedAt among its tasks — or null if it isn't complete yet. Using the real historical completion moment (not "now") is what makes this stable: an early finish stays "3 days ahead" forever, it doesn't keep growing the longer you wait to look. */
function milestoneCompletionDate(m: Milestone): Date | null {
  if (!isMilestoneComplete(m)) return null;
  const completions = m.tasks
    .map((t) => (t.completedAt ? new Date(t.completedAt).getTime() : null))
    .filter((d): d is number => d !== null);
  if (completions.length === 0) return null;
  return new Date(Math.max(...completions));
}

export function detectAheadOfPace(project: RecalibrationInput): AheadOfPaceReport {
  const daysAheadRun: number[] = [];

  for (const m of project.milestones) {
    const completedAt = milestoneCompletionDate(m);
    if (!completedAt) break;
    const { end } = getMilestoneDateRange(project, m);
    const daysAhead = (end.getTime() - completedAt.getTime()) / DAY_MS;
    if (daysAhead <= AHEAD_GRACE_DAYS) break;
    daysAheadRun.push(daysAhead);
  }

  const avgDaysAhead = daysAheadRun.length > 0 ? daysAheadRun.reduce((a, b) => a + b, 0) / daysAheadRun.length : 0;
  return { isAhead: daysAheadRun.length >= AHEAD_STREAK_MIN, streakCount: daysAheadRun.length, avgDaysAhead };
}

/**
 * The "accelerate" action for the ahead-of-pace banner: pulls every
 * incomplete milestone's date range backward by the average lead time,
 * never earlier than "now" (you can't start working on something
 * yesterday) — the mirror image of proposeRecalibration's forward shift.
 */
export function proposeAcceleration(project: RecalibrationInput, now: Date = new Date()): Milestone[] {
  const ahead = detectAheadOfPace(project);
  const pullDays = Math.max(1, Math.round(ahead.avgDaysAhead));
  const createdAt = new Date(project.createdAt);

  return project.milestones.map((m) => {
    if (isMilestoneComplete(m)) return m;
    const { start, end } = getMilestoneDateRange(project, m);
    const pulledStart = new Date(Math.max(now.getTime(), start.getTime() - pullDays * DAY_MS));
    const pulledEnd = new Date(Math.max(pulledStart.getTime() + DAY_MS, end.getTime() - pullDays * DAY_MS));
    return {
      ...m,
      startDate: pulledStart.toISOString(),
      endDate: pulledEnd.toISOString(),
      weekLabel: weekLabelFromEnd(createdAt, pulledEnd),
    };
  });
}
