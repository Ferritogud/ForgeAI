"use client";

import { GoalContext } from "@/lib/goalContext";
import { QuestionAnswer } from "./QuestionFlow";
import GlassCard from "./GlassCard";

interface ConfirmationScreenProps {
  goal: string;
  deadline?: string;
  context: GoalContext;
  answers: QuestionAnswer[];
  onGenerate: () => void;
  onAdjust: () => void;
}

/**
 * Builds the short "here's what I understood" summary deterministically from
 * the actual inputs, rather than spending a real API call on a couple of
 * templated sentences — same "no-extra-API-call UI copy" pattern used
 * elsewhere in this app (auto-titles, mock guidance, mock plan reasoning).
 */
function buildSummary(goal: string, deadline: string | undefined, context: GoalContext, answers: QuestionAnswer[]): string {
  const deadlineLabel = deadline
    ? new Date(`${deadline}T00:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : "no fixed deadline";

  const asClause = context.experienceLevel
    ? `as a ${context.experienceLevel.toLowerCase()}`
    : context.category
      ? `on a ${context.category.toLowerCase()} goal`
      : null;
  const withClause = context.timeCommitment ? `with ${context.timeCommitment} available` : null;

  const middle = [asClause, withClause].filter(Boolean).join(" ");

  let sentence1 = `Got it — you want to ${goal}`;
  if (middle) sentence1 += `, ${middle}`;
  sentence1 += `, aiming to finish by ${deadlineLabel}.`;

  if (answers.length === 0) return sentence1;

  return `${sentence1} I've also factored in your ${answers.length === 1 ? "answer" : `${answers.length} answers`} to the follow-up question${answers.length === 1 ? "" : "s"} below.`;
}

export default function ConfirmationScreen({ goal, deadline, context, answers, onGenerate, onAdjust }: ConfirmationScreenProps) {
  const summary = buildSummary(goal, deadline, context, answers);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl flex flex-col items-center animate-fade-up">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
          <span className="eyebrow">Ready to generate</span>
        </div>

        <h1 className="text-2xl font-bold text-ink-primary text-center mb-6">One more look before I plan this</h1>

        <GlassCard className="w-full rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <p className="text-sm text-ink-primary leading-relaxed">{summary}</p>

          {answers.length > 0 && (
            <div className="flex flex-col gap-2.5 pt-1 border-t border-line">
              {answers.map((a, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <p className="text-xs text-ink-faint leading-snug">{a.question}</p>
                  <p className="text-xs text-ink-secondary leading-snug">{a.answer}</p>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={onAdjust}
            className="px-4 py-2.5 rounded-full text-sm font-medium text-ink-secondary border border-line hover:border-ink-faint transition-colors"
          >
            Let me adjust something
          </button>
          <button
            onClick={onGenerate}
            className="px-6 py-2.5 rounded-full text-sm font-semibold bg-accent text-white hover:brightness-110 transition-all"
          >
            Generate my plan
          </button>
        </div>
      </div>
    </main>
  );
}
