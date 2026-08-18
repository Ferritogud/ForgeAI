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
          <p className="hud-label text-blue-glow mb-2">Forgeai // Computing</p>
          <p className="text-ink-secondary text-sm italic">&ldquo;{goal}&rdquo;</p>
        </div>

        <GlassCard className="relative overflow-hidden p-6 shadow-glow-blue">
          {/* Scanning sweep */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute left-0 right-0 h-24 bg-gradient-to-b from-transparent via-blue-glow/10 to-transparent animate-scan-line" />
          </div>

          <div className="relative flex flex-col gap-3 font-mono text-sm">
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
                  <span
                    className={`inline-block w-3.5 text-blue-glow ${
                      active ? "animate-pulse-glow" : ""
                    }`}
                  >
                    {shown && !active ? "✓" : shown ? "▸" : ""}
                  </span>
                  <span className={active ? "text-ink-primary" : "text-ink-secondary"}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="relative mt-6 h-1 w-full rounded-full bg-base-line overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-core to-blue-glow shadow-glow-blue-sm transition-all duration-500 ease-out"
              style={{ width: `${(visibleSteps / STEPS.length) * 100}%` }}
            />
          </div>
        </GlassCard>

        <p className="hud-label text-ink-faint text-center mt-6 animate-pulse-glow">
          Do not close this window
        </p>
      </div>
    </main>
  );
}
