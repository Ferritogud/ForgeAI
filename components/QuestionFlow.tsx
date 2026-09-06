"use client";

import { useEffect, useState } from "react";
import { getApiKey } from "@/lib/ai";
import { generateMockQuestions } from "@/lib/questions";
import { GoalContext } from "@/lib/goalContext";
import GlassCard from "./GlassCard";

export interface QuestionAnswer {
  question: string;
  answer: string;
}

interface QuestionFlowProps {
  goal: string;
  context?: GoalContext;
  onComplete: (answers: QuestionAnswer[]) => void;
  onSkip: () => void;
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 animate-spin shrink-0">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M2 8h11.5M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function QuestionFlow({ goal, context, onComplete, onSkip }: QuestionFlowProps) {
  const [questions, setQuestions] = useState<string[] | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal, apiKey: getApiKey(), context }),
        });
        const data = await res.json();
        const next =
          Array.isArray(data.questions) && data.questions.length > 0
            ? data.questions
            : generateMockQuestions(context);
        if (!cancelled) setQuestions(next);
      } catch {
        if (!cancelled) setQuestions(generateMockQuestions(context));
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = questions?.length ?? 0;
  const currentIndex = answers.length;
  const isDone = questions !== null && total > 0 && currentIndex >= total;

  useEffect(() => {
    if (isDone && questions) {
      onComplete(questions.map((q, i) => ({ question: q, answer: answers[i] })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone]);

  const submitAnswer = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setAnswers((prev) => [...prev, trimmed]);
    setDraft("");
  };

  if (questions === null) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="flex items-center gap-2.5 text-ink-secondary text-sm animate-fade-up">
          <SpinnerIcon />
          Thinking of a few questions about your goal…
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl flex flex-col items-center animate-fade-up">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
          <span className="eyebrow">
            Question {Math.min(currentIndex + 1, total)} of {total}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-ink-primary text-center mb-1.5">Let&apos;s shape your plan</h1>
        <p className="text-ink-secondary text-sm text-center mb-8 max-w-md italic">&ldquo;{goal}&rdquo;</p>

        <GlassCard className="w-full rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          {answers.length > 0 && (
            <div className="flex flex-col gap-3 max-h-40 overflow-y-auto pr-1 -mr-1">
              {answers.map((a, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <p className="text-xs text-ink-faint leading-snug">{questions[i]}</p>
                  <p className="text-sm text-ink-primary bg-accent-soft border border-accent/30 rounded-xl px-3 py-2 self-start">
                    {a}
                  </p>
                </div>
              ))}
              <div className="divider" />
            </div>
          )}

          <div className="flex flex-col gap-3">
            <p className="text-base font-semibold text-ink-primary leading-snug">{questions[currentIndex]}</p>
            <div className="flex items-end gap-2 rounded-2xl border border-line bg-card-muted focus-within:border-accent transition-colors px-3 py-2">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    submitAnswer();
                  }
                }}
                rows={1}
                placeholder="Type your answer..."
                className="flex-1 resize-none bg-transparent text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none py-1.5 max-h-24"
              />
              <button
                onClick={submitAnswer}
                disabled={!draft.trim()}
                className="shrink-0 p-2 rounded-xl text-accent hover:bg-accent-soft disabled:text-ink-faint disabled:pointer-events-none transition-colors"
                aria-label="Submit answer"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </GlassCard>

        <button onClick={onSkip} className="mt-5 text-xs text-ink-faint hover:text-accent transition-colors">
          Skip and generate anyway
        </button>
      </div>
    </main>
  );
}
