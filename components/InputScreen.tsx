"use client";

import { useEffect, useState } from "react";
import GlassCard from "./GlassCard";

interface InputScreenProps {
  onSubmit: (goal: string) => void;
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

export default function InputScreen({ onSubmit }: InputScreenProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

  const isEmpty = value.length === 0;
  const canSubmit = value.trim().length > 3;

  useEffect(() => {
    if (!isEmpty) return;
    const id = setInterval(() => setPlaceholderIdx((i) => (i + 1) % EXAMPLES.length), 3500);
    return () => clearInterval(id);
  }, [isEmpty]);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(value.trim());
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Decorative radial arc behind the content */}
      <svg
        viewBox="0 0 640 640"
        className="pointer-events-none absolute w-[640px] h-[640px] opacity-[0.12] animate-[spin_70s_linear_infinite]"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -55%)" }}
      >
        <circle
          cx="320"
          cy="320"
          r="300"
          fill="none"
          stroke="#00D4FF"
          strokeWidth="1.5"
          strokeDasharray="420 1500"
          strokeLinecap="round"
        />
        <circle
          cx="320"
          cy="320"
          r="260"
          fill="none"
          stroke="#3B82F6"
          strokeWidth="1"
          strokeDasharray="220 1200"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center animate-fade-up">
        <div className="flex items-center gap-2 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-glow opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-glow animate-pulse-glow" />
          </span>
          <span className="hud-label text-blue-glow/80">System Online</span>
        </div>

        <h1 className="font-mono text-3xl sm:text-4xl font-medium tracking-tight text-ink-primary text-center mb-2">
          FORGE<span className="text-blue-glow">AI</span>
        </h1>
        <p className="text-ink-secondary text-center mb-10 max-w-md">
          Turn any idea into an execution plan that adapts as you move — and tell you when you&apos;re
          falling behind.
        </p>

        <GlassCard
          className={`relative w-full p-1.5 transition-shadow duration-300 ${
            focused ? "shadow-glow-blue-lg" : ""
          }`}
          style={{ borderColor: focused ? "rgba(0,212,255,0.55)" : undefined }}
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
              className="font-mono text-[0.7rem] uppercase tracking-widest px-3.5 py-1.5 rounded-full border border-blue-dim/60 text-ink-secondary
                hover:border-blue-glow/50 hover:text-blue-glow hover:bg-blue-glow/5 transition-colors duration-200"
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between w-full mt-5 px-1">
          <span className="hud-label text-ink-faint">⌘ + Enter to submit</span>
          <span className="hud-label text-ink-faint">{value.length} / 500</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`mt-8 group relative px-10 py-3.5 rounded-full font-mono text-sm tracking-widest uppercase
            bg-amber text-white
            disabled:bg-base-raised disabled:text-ink-faint disabled:cursor-not-allowed disabled:shadow-none
            enabled:hover:shadow-glow-amber-lg enabled:hover:brightness-110
            shadow-glow-amber transition-all duration-300
            ${canSubmit ? "animate-[cta-pulse_2.4s_ease-in-out_infinite]" : ""}`}
        >
          <span className="relative z-10">Generate Plan</span>
        </button>
      </div>
    </main>
  );
}
