// Shared types/helpers for the optional structured context a user can supply
// on the initial goal screen (category, experience level, time commitment) —
// used by InputScreen (collecting it), QuestionFlow/generate-questions (so
// follow-ups don't re-ask what's already known), and generate-roadmap (so the
// plan's pacing and "Why this plan" reasoning can cite it by name). Imported
// from both client components and server route handlers, so this file must
// stay framework-agnostic (no "use client", no browser-only APIs).

export const GOAL_CATEGORIES = [
  "Academic",
  "Creative",
  "Fitness/Health",
  "Business/Career",
  "Personal Project",
  "Other",
] as const;
export type GoalCategory = (typeof GOAL_CATEGORIES)[number];

export const EXPERIENCE_LEVELS = ["Beginner", "Some experience", "Advanced"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const TIME_COMMITMENTS = ["< 5 hrs/week", "5-15 hrs/week", "15+ hrs/week"] as const;
export type TimeCommitment = (typeof TIME_COMMITMENTS)[number];

export interface GoalContext {
  category: GoalCategory | null;
  experienceLevel: ExperienceLevel | null;
  timeCommitment: TimeCommitment | null;
}

export const EMPTY_GOAL_CONTEXT: GoalContext = {
  category: null,
  experienceLevel: null,
  timeCommitment: null,
};

export function hasGoalContext(context: GoalContext | null | undefined): boolean {
  return !!context && (context.category !== null || context.experienceLevel !== null || context.timeCommitment !== null);
}

/** Midpoint hours/week estimate for a time-commitment bucket — used to turn a vague pill selection into a concrete number the plan-generation prompt can actually do arithmetic with. */
export function estimatedHoursPerWeek(timeCommitment: TimeCommitment | null | undefined): number | null {
  switch (timeCommitment) {
    case "< 5 hrs/week":
      return 3;
    case "5-15 hrs/week":
      return 10;
    case "15+ hrs/week":
      return 20;
    default:
      return null;
  }
}

/** Human-readable "Category: X. Experience level: Y..." block for embedding directly in an AI prompt — empty string if nothing was filled in. */
export function describeGoalContext(context: GoalContext | null | undefined): string {
  if (!hasGoalContext(context)) return "";
  const parts: string[] = [];
  if (context!.category) parts.push(`Category: ${context!.category}.`);
  if (context!.experienceLevel) parts.push(`Experience level: ${context!.experienceLevel}.`);
  if (context!.timeCommitment) {
    const hours = estimatedHoursPerWeek(context!.timeCommitment);
    parts.push(`Time commitment: ${context!.timeCommitment}${hours ? ` (~${hours} hrs/week)` : ""}.`);
  }
  return parts.join(" ");
}
