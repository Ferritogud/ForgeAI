"use client";

import { CSSProperties, useEffect, useState } from "react";

export interface TourStep {
  key: string;
  screen: "input" | "dashboard";
  title: string;
  body: string;
}

/**
 * The "goal-input" step only ever shows on the empty-state InputScreen, so a
 * user who already has projects when the tour starts skips straight to
 * "sidebar" — see AppShell's tour orchestration.
 */
export const ONBOARDING_STEPS: TourStep[] = [
  {
    key: "goal-input",
    screen: "input",
    title: "Start with any goal",
    body: "Describe what you're working toward — deadline optional — and ForgeAI builds you a full execution plan.",
  },
  {
    key: "sidebar",
    screen: "dashboard",
    title: "All your missions, one place",
    body: "Every project you create lives here. Switch between them anytime.",
  },
  {
    key: "progress",
    screen: "dashboard",
    title: "Real progress, not guesswork",
    body: "This tracks your actual completion rate and tells you if you're ahead of or behind pace.",
  },
  {
    key: "chat",
    screen: "dashboard",
    title: "Stuck? Just ask",
    body: "Chat with your plan anytime for suggestions, check-ins, or to talk through what's next.",
  },
];

interface OnboardingTourProps {
  step: TourStep;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

export default function OnboardingTour({ step, stepNumber, totalSteps, onNext, onSkip }: OnboardingTourProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const update = () => {
      const el = document.querySelector(`[data-tour="${step.key}"]`);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    const raf = requestAnimationFrame(update);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [step.key]);

  if (!rect) return null;

  const pad = 8;
  const spotlightStyle: CSSProperties = {
    position: "fixed",
    top: rect.top - pad,
    left: rect.left - pad,
    width: rect.width + pad * 2,
    height: rect.height + pad * 2,
    borderRadius: 14,
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
    border: "2px solid var(--accent)",
    zIndex: 300,
    pointerEvents: "none",
    transition: "top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease",
  };

  const spaceBelow = window.innerHeight - rect.bottom;
  const openUpward = spaceBelow < 180;
  const tooltipWidth = 320;

  const tooltipStyle: CSSProperties = {
    position: "fixed",
    left: Math.min(Math.max(16, rect.left), window.innerWidth - tooltipWidth - 16),
    width: tooltipWidth,
    zIndex: 301,
    ...(openUpward ? { bottom: window.innerHeight - rect.top + pad + 8 } : { top: rect.bottom + pad + 8 }),
  };

  return (
    <>
      <div style={spotlightStyle} />
      <div style={tooltipStyle} className="card rounded-2xl p-4 flex flex-col gap-3 shadow-lg animate-fade-up">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.65rem] text-ink-faint">
            STEP {stepNumber} / {totalSteps}
          </span>
          <button
            onClick={onSkip}
            className="text-xs text-ink-faint hover:text-ink-secondary transition-colors"
          >
            Skip
          </button>
        </div>
        <div>
          <p className="text-sm font-bold text-ink-primary">{step.title}</p>
          <p className="text-sm text-ink-secondary mt-1 leading-snug">{step.body}</p>
        </div>
        <button
          onClick={onNext}
          className="self-end px-4 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:brightness-110 transition-all"
        >
          {stepNumber === totalSteps ? "Finish" : "Next"}
        </button>
      </div>
    </>
  );
}
