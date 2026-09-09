"use client";

import { useEffect, useState } from "react";
import GlassCard from "./GlassCard";

const STEPS = [
  "Parsing objective...",
  "Mapping milestone structure...",
  "Sequencing tasks & dependencies...",
  "Calibrating weekly timeline...",
  "Finalizing execution plan...",
];

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 10" className="w-3 h-2.5" fill="none">
      <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface GeneratingScreenProps {
  goal: string;
}

export default function GeneratingScreen({ goal }: GeneratingScreenProps) {
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setVisibleSteps((v) => Math.max(v, i + 1)), 260 + i * 420)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xl animate-fade-up">
        <div className="text-center mb-6">
          <p className="eyebrow text-accent mb-2">ForgeAI — Computing</p>
          <p className="text-ink-secondary text-sm italic">&ldquo;{goal}&rdquo;</p>
        </div>

        <GlassCard className="relative rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-3 text-sm">
            {STEPS.map((step, i) => {
              const shown = i < visibleSteps;
              const active = i === visibleSteps - 1;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 transition-opacity duration-300 ${
                    shown ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <span className="inline-flex items-center justify-center w-3.5 text-accent">
                    {shown && !active ? <CheckIcon /> : shown ? "▸" : null}
                  </span>
                  <span className={active ? "text-ink-primary" : "text-ink-secondary"}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 h-1 w-full rounded-full bg-card-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${(visibleSteps / STEPS.length) * 100}%` }}
            />
          </div>
        </GlassCard>

        <p className="eyebrow text-center mt-6">Do not close this window</p>
      </div>
    </main>
  );
}
