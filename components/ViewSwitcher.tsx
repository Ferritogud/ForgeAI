import { ViewMode } from "@/lib/types";

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "checklist", label: "Checklist" },
  { id: "board", label: "Board" },
  { id: "timeline", label: "Timeline" },
  { id: "notes", label: "Notes" },
];

interface ViewSwitcherProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

export default function ViewSwitcher({ view, onChange }: ViewSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-line bg-card-muted">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === v.id
              ? "bg-card text-ink-primary shadow-sm"
              : "text-ink-secondary hover:text-ink-primary"
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
