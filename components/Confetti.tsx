"use client";

import { useState } from "react";

const COLORS = ["#3B82F6", "#22C55E", "#F59E0B", "#EC4899", "#8B5CF6"];

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
  width: number;
  height: number;
}

export default function Confetti() {
  const [particles] = useState<Particle[]>(() =>
    Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.6 + Math.random() * 1.1,
      color: COLORS[i % COLORS.length],
      rotate: Math.random() * 360,
      width: 5 + Math.random() * 5,
      height: 8 + Math.random() * 6,
    }))
  );

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute top-[-8%] rounded-sm animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            width: p.width,
            height: p.height,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
