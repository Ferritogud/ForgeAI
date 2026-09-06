import { forwardRef, HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { children, className = "", ...props },
  ref
) {
  return (
    <div ref={ref} className={`card rounded-2xl ${className}`} {...props}>
      {children}
    </div>
  );
});

export default GlassCard;
