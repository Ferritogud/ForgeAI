"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  percent: number;
  complete?: boolean;
}

export default function ProgressBar({ percent, complete }: ProgressBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(percent), 100);
    return () => clearTimeout(t);
  }, [percent]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="eyebrow text-2xs">Mission Progress</span>
        <span className={`font-mono text-xs ${complete ? "text-success" : "text-accent"}`}>{Math.round(percent)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-card-muted border border-line overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ease-out ${complete ? "bg-success" : "bg-accent"}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
