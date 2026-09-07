"use client";

import { ChangeEventHandler, useEffect, useRef, useState } from "react";
import { Project, Tier, TrashEntry } from "@/lib/types";
import { DEV_SIMULATE_DRIFT_DAYS } from "@/lib/recalibration";
import { ThemeMode } from "@/lib/theme";
import { TIER_INFO, TIER_ORDER } from "@/lib/tiers";
import TrashPanel from "./TrashPanel";

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path
        d="M8 1.5v8m0 0L5 6.5M8 9.5l3-3M2 12.5h12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path
        d="M8 9.5v-8m0 0L5 4.5M8 1.5l3 3M2 12.5h12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 12 10" className="w-3 h-3 shrink-0" fill="none">
      <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function SunIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1.5v1.6M8 12.9v1.6M14.5 8h-1.6M3.1 8H1.5M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1M12.6 12.6l-1.1-1.1M4.5 4.5 3.4 3.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path
        d="M13.5 9.5A5.7 5.7 0 0 1 6.5 2.5a5.7 5.7 0 1 0 7 7Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type SettingsTab = "general" | "plan" | "trash";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  onClearAll: () => void;
  onImport: (projects: Project[]) => void;
  tier: Tier;
  onSetTier: (tier: Tier) => void;
  theme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
  initialTab?: SettingsTab;
  trash: TrashEntry[];
  onRestoreTrash: (trashId: string) => { ok: boolean; reason?: string };
  onDeleteTrashPermanently: (trashId: string) => void;
  onEmptyTrash: () => void;
  activeProject: Project | null;
  onSetDevSimulatedDrift: (projectId: string, days: number) => void;
  onReplayTutorial: () => void;
}

function isProjectArray(value: unknown): value is Project[] {
  return (
    Array.isArray(value) &&
    value.every(
      (p) =>
        p &&
        typeof p === "object" &&
        typeof (p as Project).id === "string" &&
        typeof (p as Project).name === "string" &&
        Array.isArray((p as Project).milestones)
    )
  );
}

export default function SettingsPanel({
  open,
  onClose,
  projects,
  onClearAll,
  onImport,
  tier,
  onSetTier,
  theme,
  onSetTheme,
  initialTab = "general",
  trash,
  onRestoreTrash,
  onDeleteTrashPermanently,
  onEmptyTrash,
  activeProject,
  onSetDevSimulatedDrift,
  onReplayTutorial,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [clearConfirming, setClearConfirming] = useState(false);
  const [pendingImport, setPendingImport] = useState<Project[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) {
      setClearConfirming(false);
      setPendingImport(null);
      setImportError(null);
      setRedeemCode("");
      setRedeemStatus(null);
    }
  }, [open]);

  const handleRedeemCode = async () => {
    const code = redeemCode.trim();
    if (!code || redeeming) return;
    setRedeeming(true);
    setRedeemStatus(null);
    try {
      const res = await fetch("/api/redeem-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.error || !data.tier) {
        setRedeemStatus({ kind: "error", message: data.error ?? "That code isn't valid." });
        return;
      }
      onSetTier(data.tier as Tier);
      setRedeemCode("");
      setRedeemStatus({ kind: "success", message: `Unlocked ${TIER_INFO[data.tier as Tier].label}!` });
    } catch {
      setRedeemStatus({ kind: "error", message: "Something went wrong — please try again." });
    } finally {
      setRedeeming(false);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `forgeai-projects-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelected: ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!isProjectArray(parsed)) {
          setImportError("That file doesn't look like a ForgeAI export.");
          return;
        }
        setImportError(null);
        setPendingImport(parsed);
      } catch {
        setImportError("Couldn't read that file — make sure it's valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed right-0 top-0 z-[120] h-screen w-full max-w-md flex flex-col
          border-l border-line bg-card
          transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div>
            <p className="eyebrow text-accent">System</p>
            <h2 className="text-xl font-bold text-ink-primary mt-1">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-ink-secondary hover:text-accent hover:bg-accent-soft transition-colors"
            aria-label="Close settings"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex px-6 gap-1 shrink-0">
          {(["general", "plan", "trash"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-2 rounded-t-lg text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-accent text-accent"
                  : "border-transparent text-ink-faint hover:text-ink-secondary"
              }`}
            >
              {tab === "general" ? "General" : tab === "plan" ? "Plan" : "Trash"}
            </button>
          ))}
        </div>

        {activeTab === "general" && (
        <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col gap-8">
          {/* Appearance */}
          <section className="flex flex-col gap-3">
            <span className="eyebrow">Appearance</span>
            <div className="flex gap-2">
              <button
                onClick={() => onSetTheme("light")}
                className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  theme === "light"
                    ? "border-accent text-accent bg-accent-soft"
                    : "border-line text-ink-secondary hover:border-ink-faint"
                }`}
              >
                <SunIcon />
                Light
              </button>
              <button
                onClick={() => onSetTheme("dark")}
                className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                  theme === "dark"
                    ? "border-accent text-accent bg-accent-soft"
                    : "border-line text-ink-secondary hover:border-ink-faint"
                }`}
              >
                <MoonIcon />
                Dark
              </button>
            </div>
          </section>

          {/* Tutorial */}
          <section className="flex flex-col gap-3">
            <div className="divider" />
            <span className="eyebrow">Tutorial</span>
            <button
              onClick={onReplayTutorial}
              className="px-3.5 py-2.5 rounded-xl border border-line text-ink-secondary text-sm font-medium hover:border-accent hover:text-accent transition-colors text-left"
            >
              Replay tutorial
            </button>
          </section>

          {/* Export / Import */}
          <section className="flex flex-col gap-3">
            <div className="divider" />
            <span className="eyebrow">Export &amp; Import</span>

            <div className="flex gap-2.5">
              <button
                onClick={handleExport}
                disabled={projects.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-line text-ink-secondary text-sm font-medium hover:border-accent hover:text-accent transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <DownloadIcon />
                Export
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-line text-ink-secondary text-sm font-medium hover:border-accent hover:text-accent transition-colors"
              >
                <UploadIcon />
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleFileSelected}
              />
            </div>

            {importError && <p className="text-xs text-warn">{importError}</p>}

            {pendingImport && (
              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl border border-line bg-card-muted">
                <p className="text-xs text-ink-secondary leading-snug">
                  This will replace your{" "}
                  <span className="text-ink-primary font-medium">{projects.length}</span> current
                  project(s) with{" "}
                  <span className="text-ink-primary font-medium">{pendingImport.length}</span> imported
                  project(s).
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPendingImport(null)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-secondary border border-line hover:border-ink-faint transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onImport(pendingImport);
                      setPendingImport(null);
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-accent hover:brightness-110 transition-all"
                  >
                    Import
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Reset */}
          <section className="flex flex-col gap-3">
            <div className="divider" />
            <span className="eyebrow">Reset</span>

            {!clearConfirming ? (
              <button
                onClick={() => setClearConfirming(true)}
                disabled={projects.length === 0}
                className="px-3.5 py-2.5 rounded-xl border border-warn/30 text-warn text-sm font-medium hover:border-warn hover:bg-warn-soft transition-colors disabled:opacity-40 disabled:pointer-events-none text-left"
              >
                Clear all projects
              </button>
            ) : (
              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl border border-warn/30 bg-warn-soft">
                <p className="text-xs text-ink-secondary leading-snug">
                  Delete all <span className="text-ink-primary font-medium">{projects.length}</span>{" "}
                  project(s)? This can&apos;t be undone.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setClearConfirming(false)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-secondary border border-line hover:border-ink-faint transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearAll();
                      setClearConfirming(false);
                    }}
                    className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-warn hover:brightness-110 transition-all"
                  >
                    Delete All
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div className="divider" />
            <p className="text-xs text-ink-faint text-center">
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors underline underline-offset-2">
                Terms
              </a>
              {" · "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors underline underline-offset-2">
                Privacy Policy
              </a>
            </p>
          </section>

          {/* Dev-only: simulate drift to demo recalibration without waiting real days */}
          {process.env.NODE_ENV !== "production" && activeProject && (
            <section className="flex flex-col gap-3">
              <div className="divider" />
              <span className="eyebrow">Developer</span>
              <p className="text-xs text-ink-faint leading-snug">
                Simulates time passing for <span className="text-ink-secondary">{activeProject.name}</span> so you
                can trigger recalibration without waiting real days. Dev builds only.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onSetDevSimulatedDrift(activeProject.id, DEV_SIMULATE_DRIFT_DAYS)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-line text-ink-secondary text-sm font-medium hover:border-accent hover:text-accent transition-colors"
                >
                  Dev: Simulate {DEV_SIMULATE_DRIFT_DAYS} days behind
                </button>
                <button
                  onClick={() => onSetDevSimulatedDrift(activeProject.id, 0)}
                  disabled={activeProject.devSimulatedDriftDays === 0}
                  className="px-3.5 py-2.5 rounded-xl border border-line text-ink-faint text-sm font-medium hover:border-ink-faint transition-colors disabled:opacity-40 disabled:pointer-events-none"
                >
                  Reset
                </button>
              </div>
            </section>
          )}
        </div>
        )}

        {activeTab === "plan" && (
          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-5 flex flex-col gap-4">
            {TIER_ORDER.map((t) => {
              const info = TIER_INFO[t];
              const isCurrent = t === tier;
              const isUpgrade = TIER_ORDER.indexOf(t) > TIER_ORDER.indexOf(tier);

              return (
                <div
                  key={t}
                  className={`rounded-2xl border p-4 flex flex-col gap-3 transition-colors ${
                    isCurrent ? "border-accent bg-accent-soft" : "border-line"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-ink-primary font-bold text-base">{info.label}</span>
                    <span className="text-sm text-ink-secondary">{info.price}</span>
                  </div>

                  <ul className="flex flex-col gap-1.5">
                    {info.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-ink-secondary">
                        <span className="text-accent">
                          <CheckIcon />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <span className="text-xs font-medium text-accent text-center py-2 border border-accent/30 rounded-xl">
                      Current Plan
                    </span>
                  ) : isUpgrade ? (
                    <span className="text-xs font-medium text-ink-faint text-center py-2 border border-line rounded-xl">
                      Unlock with a code below
                    </span>
                  ) : null}
                </div>
              );
            })}

            <div className="flex flex-col gap-2.5 pt-1">
              <div className="divider" />
              <span className="eyebrow">Have a code?</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRedeemCode();
                  }}
                  placeholder="Enter upgrade code"
                  spellCheck={false}
                  autoComplete="off"
                  className="flex-1 bg-card-muted border border-line rounded-xl px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-accent transition-colors font-mono"
                />
                <button
                  onClick={handleRedeemCode}
                  disabled={!redeemCode.trim() || redeeming}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-accent hover:brightness-110 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {redeeming ? "..." : "Redeem"}
                </button>
              </div>
              {redeemStatus && (
                <p className={`text-xs leading-snug ${redeemStatus.kind === "success" ? "text-accent" : "text-warn"}`}>
                  {redeemStatus.message}
                </p>
              )}
              <p className="text-xs text-ink-faint leading-snug text-center mt-1">
                Upgrades unlock with an invite code — no self-serve payment yet.
              </p>
            </div>
          </div>
        )}

        {activeTab === "trash" && (
          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-5">
            <TrashPanel
              entries={trash}
              onRestore={onRestoreTrash}
              onDeletePermanently={onDeleteTrashPermanently}
              onEmptyTrash={onEmptyTrash}
            />
          </div>
        )}
      </aside>
    </>
  );
}
