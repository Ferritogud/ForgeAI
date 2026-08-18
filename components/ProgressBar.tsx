"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  percent: number;
}

export default function ProgressBar({ percent }: ProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 100);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="hud-label text-ink-secondary">Mission Progress</span>
        <span className="font-mono text-sm text-blue-glow">{Math.round(percent)}%</span>
      </div>
      <div className="h-3 w-full rounded-full bg-base-deep border border-blue-dim/40 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out relative"
          style={{
            width: `${width}%`,
            background: "linear-gradient(90deg, #1D1D3D 0%, #3B82F6 55%, #00D4FF 100%)",
            boxShadow: "0 0 16px rgba(0,212,255,0.55), 0 0 4px rgba(0,212,255,0.8)",
          }}
        >
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-white/30 blur-sm" />
        </div>
      </div>
    </div>
  );
}
