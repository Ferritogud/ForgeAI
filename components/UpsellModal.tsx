"use client";

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

interface UpsellModalProps {
  open: boolean;
  onClose: () => void;
  onViewPlans: () => void;
  limit: number;
}

export default function UpsellModal({ open, onClose, onViewPlans, limit }: UpsellModalProps) {
  return (
    <div
      className={`fixed inset-0 z-[130] flex items-center justify-center px-6 transition-opacity duration-300 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative card rounded-2xl w-full max-w-sm p-6 flex flex-col gap-4 shadow-lg">
        <div className="flex items-start justify-between">
          <p className="eyebrow text-warn">Mission Limit</p>
          <button
            onClick={onClose}
            className="p-1 -mt-1 -mr-1 rounded-lg text-ink-secondary hover:text-accent transition-colors"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        <div>
          <h3 className="text-lg font-bold text-ink-primary mb-1.5">You&apos;ve hit your project limit</h3>
          <p className="text-sm text-ink-secondary leading-snug">
            Your current plan supports up to {limit} active project{limit === 1 ? "" : "s"}. Upgrade to Gold
            or Platinum for more room to run missions in parallel.
          </p>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={onClose}
            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm font-medium text-ink-secondary border border-line hover:border-ink-faint transition-colors"
          >
            Not now
          </button>
          <button
            onClick={onViewPlans}
            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm font-medium text-white bg-accent hover:brightness-110 transition-all"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}
