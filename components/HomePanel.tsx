"use client";

import { useEffect, useMemo, useState } from "react";
import { MockUser, Project, Tier } from "@/lib/types";
import { isMilestoneComplete, getMilestoneStatus } from "@/lib/milestones";
import { TIER_LIMITS } from "@/lib/tiers";
import StreakBadge from "./StreakBadge";

function BoltIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M8.5 1.5 3 9h4l-.5 5.5L13 7H9l-.5-5.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
function FolderStatIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path
        d="M2 4.5a1 1 0 0 1 1-1h3.2l1.2 1.4H13a1 1 0 0 1 1 1v6.1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CheckStatIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function FlameStatIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path
        d="M8 1.5s3 2.6 3 5.3a3 3 0 0 1-6 0c0-.7.3-1.3.7-1.9-.2 1 .1 1.6.6 1.9-.3-1.8.6-3 1.7-4.1Zm-2.7 8.9A3.6 3.6 0 0 0 8 14.5a3.6 3.6 0 0 0 2.7-4.1c-.6.9-1.6 1.5-2.7 1.5s-2.1-.6-2.7-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
function SendMiniIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M2 8h11.5M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path
        d="M2 4.5a1 1 0 0 1 1-1h3.2l1.2 1.4H13a1 1 0 0 1 1 1v6.1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-7.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function SparkleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path d="M8 1.5 9.2 5.3 13 6.5l-3.8 1.2L8 11.5 6.8 7.7 3 6.5l3.8-1.2L8 1.5Z" fill="currentColor" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 12 10" className="w-2.5 h-2.5 transition-opacity duration-150" fill="none">
      <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path
        d="M4.5 2.5h7v3.5a3.5 3.5 0 0 1-7 0V2.5ZM4.5 3.5h-2v1a2 2 0 0 0 2 2M11.5 3.5h2v1a2 2 0 0 1-2 2M8 9.5V12M5.5 13.5h5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface FocusItem {
  projectId: string;
  projectName: string;
  milestoneIndex: number;
  taskIndex: number;
  taskId: string;
  text: string;
  completed: boolean;
  slipped: boolean;
}

interface QuickWin {
  projectId: string;
  projectName: string;
  milestoneIndex: number;
  taskIndex: number;
  taskId: string;
  text: string;
  completed: boolean;
}

interface HomePanelProps {
  user: MockUser;
  projects: Project[];
  tier: Tier;
  badgeCount: number;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onOpenSoundboard: () => void;
  onToggleTask: (projectId: string, milestoneIndex: number, taskIndex: number) => void;
  onRecordTokens: (tokens: number) => void;
  onQuickCapture: (text: string) => void;
}

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePanel({
  user,
  projects,
  tier,
  badgeCount,
  onSelectProject,
  onNewProject,
  onOpenSoundboard,
  onToggleTask,
  onRecordTokens,
  onQuickCapture,
}: HomePanelProps) {
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const [captureDraft, setCaptureDraft] = useState("");

  const submitCapture = () => {
    const text = captureDraft.trim();
    if (!text) return;
    onQuickCapture(text);
    setCaptureDraft("");
  };

  const focusItems = useMemo<FocusItem[]>(() => {
    const items: FocusItem[] = [];
    for (const project of projects) {
      const milestoneIndex = project.milestones.findIndex((m) => !isMilestoneComplete(m));
      if (milestoneIndex < 0) continue;
      const milestone = project.milestones[milestoneIndex];
      const slipped = getMilestoneStatus(project, milestone) === "slipped";
      const pending = milestone.tasks
        .map((t, taskIndex) => ({ t, taskIndex }))
        .filter(({ t }) => !t.completed)
        .slice(0, 2);
      for (const { t, taskIndex } of pending) {
        items.push({
          projectId: project.id,
          projectName: project.name,
          milestoneIndex,
          taskIndex,
          taskId: t.id,
          text: t.text,
          completed: t.completed,
          slipped,
        });
      }
    }
    // Slipped projects first — that's where attention is actually needed today.
    items.sort((a, b) => Number(b.slipped) - Number(a.slipped));
    return items.slice(0, 6);
  }, [projects]);

  // The smallest, easiest pending task across every project — tasks with no
  // subtasks (nothing to break down further) win, shortest text as a rough
  // "quick to knock out" tiebreaker. The point is a always-available "I only
  // have 2 minutes" option, distinct from Today's Focus above.
  const quickWin = useMemo<QuickWin | null>(() => {
    const candidates: QuickWin[] = [];
    for (const project of projects) {
      project.milestones.forEach((milestone, milestoneIndex) => {
        milestone.tasks.forEach((task, taskIndex) => {
          if (task.completed) return;
          candidates.push({
            projectId: project.id,
            projectName: project.name,
            milestoneIndex,
            taskIndex,
            taskId: task.id,
            text: task.text,
            completed: task.completed,
          });
        });
      });
    }
    if (candidates.length === 0) return null;

    const withoutSubtasks = candidates.filter((c) => {
      const project = projects.find((p) => p.id === c.projectId);
      const task = project?.milestones[c.milestoneIndex]?.tasks[c.taskIndex];
      return (task?.subtasks.length ?? 0) === 0;
    });
    const pool = withoutSubtasks.length > 0 ? withoutSubtasks : candidates;
    return pool.reduce((shortest, c) => (c.text.length < shortest.text.length ? c : shortest), pool[0]);
  }, [projects]);

  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const [focusMessageLoading, setFocusMessageLoading] = useState(true);

  // A short project summary is the effect dependency (not `projects` itself)
  // so this only re-fetches when something that'd actually change the
  // message changes — not on every unrelated re-render.
  const focusSummary = useMemo(
    () =>
      projects.map((project) => {
        const milestone = project.milestones.find((m) => !isMilestoneComplete(m));
        return {
          name: project.name,
          currentMilestone: milestone?.title ?? null,
          pendingCount: milestone ? milestone.tasks.filter((t) => !t.completed).length : 0,
          slipped: milestone ? getMilestoneStatus(project, milestone) === "slipped" : false,
        };
      }),
    [projects]
  );
  const focusSummaryKey = JSON.stringify(focusSummary);

  useEffect(() => {
    if (focusSummary.length === 0) {
      setFocusMessageLoading(false);
      return;
    }
    let cancelled = false;
    setFocusMessageLoading(true);
    // Debounced — checking off several tasks in a row on this screen would
    // otherwise fire one AI call per click. Only the state after activity
    // settles is worth a fresh message.
    const timer = setTimeout(() => {
      fetch("/api/home-focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: focusSummary }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (typeof data.message === "string") setFocusMessage(data.message);
          if (data.usage) onRecordTokens(data.usage.inputTokens + data.usage.outputTokens);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setFocusMessageLoading(false);
        });
    }, 1200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSummaryKey]);

  const maxStreak = Math.max(0, ...projects.map((p) => p.streakCount));
  const allTasks = projects.flatMap((p) => p.milestones.flatMap((m) => m.tasks));
  const doneThisWeekCount = (() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return allTasks.filter((t) => t.completed && t.completedAt && new Date(t.completedAt).getTime() >= weekAgo).length;
  })();

  const projectLimit = TIER_LIMITS[tier];
  const atProjectLimit = projects.length >= projectLimit;

  return (
    <main className="min-h-screen px-6 sm:px-10 py-4 sm:py-5">
      <div className="flex flex-col gap-1.5 mb-6">
        <span className="eyebrow">Control Center</span>
        <div className="flex items-center flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-ink-primary">
            {timeOfDayGreeting()}, {firstName}
          </h1>
          {maxStreak > 0 && <StreakBadge streakCount={maxStreak} />}
        </div>
      </div>

      {/* AI coach line — its own tinted card so it reads as a distinct,
          living moment rather than a caption under the greeting. */}
      {projects.length > 0 && (
        <div className="rounded-2xl border border-accent/25 bg-accent-soft p-4 mb-6 flex items-start gap-3">
          <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-accent text-white">
            <SparkleIcon />
          </span>
          <div className="min-w-0 flex-1 pt-1">
            {focusMessageLoading ? (
              <span className="block h-4 w-64 max-w-full rounded bg-card-muted animate-pulse" />
            ) : (
              <p className="text-sm text-ink-primary leading-relaxed">{focusMessage}</p>
            )}
          </div>
        </div>
      )}

      {/* Quick capture — jot a loose idea and it lands straight in the
          Soundboard as a message, no project or modal to pick first. */}
      <div className="flex items-center gap-2 mb-8">
        <span className="shrink-0 text-ink-faint">
          <BoltIcon />
        </span>
        <input
          type="text"
          value={captureDraft}
          onChange={(e) => setCaptureDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitCapture();
          }}
          placeholder="Capture a quick idea…"
          className="flex-1 min-w-0 bg-transparent border-b border-line focus:border-accent text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none py-1.5 transition-colors"
        />
        <button
          onClick={submitCapture}
          disabled={!captureDraft.trim()}
          aria-label="Send to Soundboard"
          className="shrink-0 p-1.5 rounded-lg text-accent hover:bg-accent-soft disabled:text-ink-faint disabled:pointer-events-none transition-colors"
        >
          <SendMiniIcon />
        </button>
      </div>

      {/* Quick stats — each with its own accent color instead of uniform
          gray, so the row carries some life instead of reading as a bare
          data table. */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="card rounded-2xl p-4 flex items-start gap-3">
          <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-accent-soft text-accent">
            <FolderStatIcon />
          </span>
          <div className="min-w-0">
            <span className="eyebrow">Active Projects</span>
            <p className="text-2xl font-bold text-ink-primary mt-0.5">{projects.length}</p>
          </div>
        </div>
        <div className="card rounded-2xl p-4 flex items-start gap-3">
          <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-success-soft text-success">
            <CheckStatIcon />
          </span>
          <div className="min-w-0">
            <span className="eyebrow">Done This Week</span>
            <p className="text-2xl font-bold text-ink-primary mt-0.5">{doneThisWeekCount}</p>
          </div>
        </div>
        <div className="card rounded-2xl p-4 flex items-start gap-3">
          <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-momentum-soft text-momentum">
            <FlameStatIcon />
          </span>
          <div className="min-w-0">
            <span className="eyebrow">Best Streak</span>
            <p className="text-2xl font-bold text-ink-primary mt-0.5">{maxStreak}</p>
          </div>
        </div>
        <div className="card rounded-2xl p-4 flex items-start gap-3">
          <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-momentum-soft text-momentum">
            <TrophyIcon />
          </span>
          <div className="min-w-0">
            <span className="eyebrow">Badges</span>
            <p className="text-2xl font-bold text-ink-primary mt-0.5">{badgeCount}</p>
          </div>
        </div>
      </div>

      {/* Quick win — always-visible smallest available task, for whenever
          there's only a couple of minutes to spare. */}
      {quickWin && (
        <section className="mb-8">
          <div className="card rounded-2xl p-4 border-momentum/30 bg-momentum-soft flex items-center gap-3">
            <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-card text-momentum">
              <BoltIcon />
            </span>
            <div className="min-w-0 flex-1">
              <span className="eyebrow text-momentum">Quick Win</span>
              <p className="text-sm text-ink-primary truncate">{quickWin.text}</p>
            </div>
            <span className="relative shrink-0">
              <input
                type="checkbox"
                checked={quickWin.completed}
                onChange={() => onToggleTask(quickWin.projectId, quickWin.milestoneIndex, quickWin.taskIndex)}
                className="peer sr-only"
                id={`quickwin-${quickWin.taskId}`}
              />
              <label
                htmlFor={`quickwin-${quickWin.taskId}`}
                className="flex items-center justify-center w-[18px] h-[18px] rounded-md border cursor-pointer transition-all duration-200
                  border-line bg-card
                  peer-checked:border-success peer-checked:bg-success-soft peer-checked:animate-check-pop
                  hover:border-success text-success"
              >
                <CheckIcon />
              </label>
            </span>
          </div>
        </section>
      )}

      {/* Today's focus — the whole point of this screen: land here, see the
          handful of tasks across every project that actually matter right
          now, and act on them without picking a project first. */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-ink-primary">Today&apos;s Focus</h2>
          {focusItems.some((i) => i.slipped) && (
            <span className="text-2xs font-medium text-warn">Some milestones need attention</span>
          )}
        </div>

        {focusItems.length === 0 ? (
          <div className="card rounded-2xl p-6 text-center">
            <p className="text-sm text-ink-secondary">
              Nothing pending right now — every active milestone is caught up. Nice work.
            </p>
          </div>
        ) : (
          <div className="card rounded-2xl divide-y divide-line overflow-hidden">
            {focusItems.map((item) => (
              <div key={item.taskId} className="flex items-center gap-3 px-4 py-3 hover:bg-card-muted transition-colors">
                <span className="relative shrink-0">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => onToggleTask(item.projectId, item.milestoneIndex, item.taskIndex)}
                    className="peer sr-only"
                    id={`focus-${item.taskId}`}
                  />
                  <label
                    htmlFor={`focus-${item.taskId}`}
                    className="flex items-center justify-center w-[18px] h-[18px] rounded-md border cursor-pointer transition-all duration-200
                      border-line bg-card-muted
                      peer-checked:border-success peer-checked:bg-success-soft peer-checked:animate-check-pop
                      hover:border-success text-success"
                  >
                    <CheckIcon />
                  </label>
                </span>
                <button
                  onClick={() => onSelectProject(item.projectId)}
                  className="flex-1 min-w-0 flex items-center gap-2.5 text-left"
                >
                  <span className="text-sm text-ink-primary truncate">{item.text}</span>
                  <span className="shrink-0 text-2xs font-mono text-ink-faint px-1.5 py-0.5 rounded-full border border-line truncate max-w-[140px]">
                    {item.projectName}
                  </span>
                  {item.slipped && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-warn" aria-label="Slipped" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Projects grid */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-ink-primary">Your Projects</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSoundboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-accent hover:bg-accent-soft transition-colors"
            >
              <SparkleIcon />
              Soundboard
            </button>
            <button
              onClick={onNewProject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-accent hover:brightness-110 transition-all"
            >
              <PlusIcon />
              New Project
            </button>
          </div>
        </div>

        {atProjectLimit && (
          <p className="text-2xs text-ink-faint mb-3">
            You&apos;re at your plan&apos;s project limit ({projectLimit}) — upgrade in Settings for more room.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => {
            const allTasks = project.milestones.flatMap((m) => m.tasks);
            const done = allTasks.filter((t) => t.completed).length;
            const percent = allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;
            const currentMilestone = project.milestones.find((m) => !isMilestoneComplete(m));
            const slipped = currentMilestone ? getMilestoneStatus(project, currentMilestone) === "slipped" : false;

            return (
              <button
                key={project.id}
                onClick={() => onSelectProject(project.id)}
                className="card rounded-2xl p-4 flex flex-col gap-3 text-left hover:border-accent/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-card-muted text-base">
                    {project.icon ?? <FolderIcon />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-primary truncate">{project.name}</p>
                    <p className="text-2xs text-ink-faint truncate">
                      {currentMilestone ? currentMilestone.title : "All milestones complete"}
                    </p>
                  </div>
                  {slipped && <span className="shrink-0 w-2 h-2 rounded-full bg-warn" title="Slipped" />}
                </div>
                <div className="h-1.5 w-full rounded-full bg-card-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ease-out ${
                      percent >= 100 ? "bg-success" : "bg-accent"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-2xs font-mono text-ink-faint">
                  <span>{percent}% complete</span>
                  {project.streakCount > 0 && <span className="text-momentum">{project.streakCount}d streak</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
