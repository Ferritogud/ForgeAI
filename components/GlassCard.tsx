import { HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function GlassCard({ children, className = "", ...props }: GlassCardProps) {
  return (
    <div className={`hud-glass rounded-2xl ${className}`} {...props}>
      {children}
    </div>
  );
}
