import { GoalContext } from "./goalContext";

/**
 * Generic-but-relevant fallback clarifying questions — used both in mock
 * mode (no API key) and as a graceful fallback if the real question-generation
 * call fails, so a flaky/missing key never strands the user mid-flow. Not
 * goal-specific like the real API path, just good enough to shape a plan a
 * bit better than nothing.
 *
 * Skips whichever of these a structured field on the initial screen already
 * answered (time commitment / experience level), and adds a domain-specific
 * one in its place so the slot isn't wasted — same "don't re-ask what's
 * already known" principle the real API prompt follows.
 */
export function generateMockQuestions(context?: GoalContext): string[] {
  const questions: string[] = [];

  if (!context?.timeCommitment) {
    questions.push("About how many hours per week can you realistically put into this?");
  }
  if (!context?.experienceLevel) {
    questions.push("Would you say you're a complete beginner, or do you already have some experience?");
  }
  questions.push("Is there anything constraining you — budget, deadline, equipment, or something else?");

  if (context?.timeCommitment && context?.experienceLevel) {
    questions.push("What tools, materials, or resources do you already have access to for this?");
  }

  return questions;
}
