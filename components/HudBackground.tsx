export default function HudBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-base">
      <div className="absolute inset-0 hud-grid-bg opacity-60" />

      {/* Ambient glow blobs */}
      <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-glow/10 blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-core/10 blur-[120px]" />

      {/* Corner HUD brackets */}
      <div className="absolute top-6 left-6 w-10 h-10 border-t border-l border-blue-glow/30" />
      <div className="absolute top-6 right-6 w-10 h-10 border-t border-r border-blue-glow/30" />
      <div className="absolute bottom-6 left-6 w-10 h-10 border-b border-l border-blue-glow/30" />
      <div className="absolute bottom-6 right-6 w-10 h-10 border-b border-r border-blue-glow/30" />

      {/* Vignette to keep focus centered */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 40%, rgba(13,13,26,0.6) 100%)",
        }}
      />
    </div>
  );
}
