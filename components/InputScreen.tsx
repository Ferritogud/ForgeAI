"use client";

import { useEffect, useState } from "react";
import { PROJECT_TEMPLATES } from "@/lib/templates";
import {
  EXPERIENCE_LEVELS,
  GOAL_CATEGORIES,
  GoalCategory,
  GoalContext,
  ExperienceLevel,
  TIME_COMMITMENTS,
  TimeCommitment,
} from "@/lib/goalContext";
import { detectCategory } from "@/lib/categoryDetection";
import GlassCard from "./GlassCard";

interface InputScreenProps {
  onSubmit: (goal: string, deadline?: string, context?: GoalContext) => void;
  onSelectTemplate: (templateId: string) => void;
  error?: string | null;
}

const EXAMPLES = [
  "Grow my YouTube channel to 10,000 subscribers in 6 months",
  "Score 1400+ on the SAT / Icfes before December",
  "Finish my thesis draft by the end of the semester",
  "Launch my startup's MVP in 8 weeks",
];

const CHIPS = [
  { label: "YouTube Channel", text: EXAMPLES[0] },
  { label: "SAT / Icfes Prep", text: EXAMPLES[1] },
  { label: "Thesis Sprint", text: EXAMPLES[2] },
];

export default function InputScreen({ onSubmit, onSelectTemplate, error }: InputScreenProps) {
  const [value, setValue] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState<GoalCategory | null>(null);
  // Tracks whether the current category came from auto-detection vs a manual
  // click, purely for the "detected" visual treatment below — and whether
  // the user has ever manually touched it, which permanently stops
  // auto-detection from overriding their choice (task requires it never
  // "lock" them into a guess, but it must equally never fight a real pick).
  const [categoryIsAuto, setCategoryIsAuto] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [timeCommitment, setTimeCommitment] = useState<TimeCommitment | null>(null);
  const [focused, setFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const isEmpty = value.length === 0;
  const canSubmit = value.trim().length > 3;

  useEffect(() => {
    if (!isEmpty) return;
    const id = setInterval(() => setPlaceholderIdx((i) => (i + 1) % EXAMPLES.length), 3500);
    return () => clearInterval(id);
  }, [isEmpty]);

  // Debounced client-side keyword guess — cheap enough to run on every pause
  // in typing rather than needing an API call for something this low-stakes.
  useEffect(() => {
    if (categoryTouched) return;
    const id = setTimeout(() => {
      const guess = detectCategory(value);
      if (guess) {
        setCategory(guess);
        setCategoryIsAuto(true);
      }
    }, 500);
    return () => clearTimeout(id);
  }, [value, categoryTouched]);

  const selectCategory = (c: GoalCategory) => {
    setCategoryTouched(true);
    setCategoryIsAuto(false);
    setCategory((prev) => (prev === c ? null : c));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(value.trim(), deadline || undefined, { category, experienceLevel, timeCommitment });
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6">
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center animate-fade-up">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
          <span className="eyebrow">System Online</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink-primary text-center mb-2">
          Forge<span className="text-accent">AI</span>
        </h1>
        <p className="text-ink-secondary text-center mb-10 max-w-md">
          Turn any idea into an execution plan that adapts as you move — and tell you when you&apos;re
          falling behind.
        </p>

        {error && (
          <div className="w-full rounded-xl border border-warn/30 bg-warn-soft px-4 py-3 mb-4 text-sm text-warn leading-snug">
            Couldn&apos;t reach the Anthropic API: {error} — check your key in Settings, or leave it blank to use demo data.
          </div>
        )}

        <GlassCard
          data-tour="goal-input"
          className={`relative w-full rounded-2xl p-1.5 transition-colors duration-300 ${
            focused ? "border-accent" : ""
          }`}
        >
          <div className="relative">
            {isEmpty && (
              <div className="pointer-events-none absolute inset-0 px-5 py-4 overflow-hidden">
                <span key={placeholderIdx} className="block text-lg text-ink-faint animate-fade-up">
                  {EXAMPLES[placeholderIdx]}
                </span>
              </div>
            )}
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSubmit();
                }
                if (e.key === "Tab" && isEmpty) {
                  e.preventDefault();
                  setValue(EXAMPLES[placeholderIdx]);
                }
              }}
              placeholder=""
              rows={4}
              className="relative w-full resize-none bg-transparent px-5 py-4 text-lg text-ink-primary focus:outline-none font-sans"
            />
          </div>
        </GlassCard>

        <div className="flex flex-wrap items-center justify-center gap-2 w-full mt-4">
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => setValue(chip.text)}
              className="text-xs font-medium px-3.5 py-1.5 rounded-full border border-line text-ink-secondary
                hover:border-accent hover:text-accent hover:bg-accent-soft transition-colors duration-200"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <GlassCard className="w-full rounded-2xl p-4 mt-5 flex flex-col gap-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="eyebrow flex items-center gap-1.5">
              Category <span className="text-ink-faint normal-case font-normal">(optional)</span>
              {category && categoryIsAuto && (
                <span className="text-accent normal-case font-normal">· detected, click to change</span>
              )}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {GOAL_CATEGORIES.map((c) => {
                const selected = category === c;
                const auto = selected && categoryIsAuto;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => selectCategory(c)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors duration-200 ${
                      auto
                        ? "border-accent/40 border-dashed bg-accent-soft/60 text-accent"
                        : selected
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-line text-ink-secondary hover:border-accent hover:text-accent hover:bg-accent-soft"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-5">
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="eyebrow">
                Experience <span className="text-ink-faint normal-case font-normal">(optional)</span>
              </span>
              <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-line bg-card-muted self-start w-full sm:w-auto">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setExperienceLevel((prev) => (prev === level ? null : level))}
                    className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      experienceLevel === level
                        ? "bg-card text-ink-primary shadow-sm"
                        : "text-ink-secondary hover:text-ink-primary"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 flex-1">
              <span className="eyebrow">
                Time commitment <span className="text-ink-faint normal-case font-normal">(optional)</span>
              </span>
              <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-line bg-card-muted self-start w-full sm:w-auto">
                {TIME_COMMITMENTS.map((tc) => (
                  <button
                    key={tc}
                    type="button"
                    onClick={() => setTimeCommitment((prev) => (prev === tc ? null : tc))}
                    className={`flex-1 sm:flex-none px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      timeCommitment === tc
                        ? "bg-card text-ink-primary shadow-sm"
                        : "text-ink-secondary hover:text-ink-primary"
                    }`}
                  >
                    {tc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="deadline" className="text-xs font-medium text-ink-secondary">
              Deadline <span className="text-ink-faint">(optional)</span>
            </label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="text-xs font-medium px-2.5 py-1 rounded-lg border border-line bg-transparent text-ink-secondary focus:outline-none focus:border-accent"
            />
          </div>
        </GlassCard>

        <div className="flex items-center justify-between w-full mt-5 px-1">
          <span className="eyebrow">
            {isEmpty ? "Tab to autofill · ⌘ + Enter to submit" : "⌘ + Enter to submit"}
          </span>
          <span className="eyebrow">{value.length} / 10000</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-8 px-10 py-3.5 rounded-full text-sm font-semibold uppercase tracking-wide
            bg-accent text-white
            disabled:bg-card-muted disabled:text-ink-faint disabled:cursor-not-allowed
            enabled:hover:brightness-110
            transition-all duration-300"
        >
          Generate Plan
        </button>

        <div className="flex items-center gap-3 w-full mt-10 mb-5 max-w-md">
          <div className="flex-1 h-px bg-line" />
          <span className="eyebrow whitespace-nowrap">Or start from a template</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          {PROJECT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className="flex flex-col items-start gap-2 p-4 rounded-2xl border border-line text-left hover:border-accent hover:bg-accent-soft transition-colors duration-200"
            >
              <span className="text-2xl">{template.icon}</span>
              <span className="text-sm font-semibold text-ink-primary">{template.label}</span>
              <span className="text-xs text-ink-faint leading-snug">{template.description}</span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
