"use client";

import { useEffect, useRef, useState } from "react";
import { Attachment, Milestone, Project, ViewMode } from "@/lib/types";
import { BoardColumn } from "@/hooks/useProjects";
import { detectAheadOfPace, proposeAcceleration, proposeRecalibration, RE_PROMPT_COOLDOWN_DAYS } from "@/lib/recalibration";
import ProgressBar from "./ProgressBar";
import ChecklistView from "./ChecklistView";
import ProjectionsPanel from "./ProjectionsPanel";
import StreakBadge from "./StreakBadge";
import DeadlineBadge from "./DeadlineBadge";
import Confetti from "./Confetti";
import ViewSwitcher from "./ViewSwitcher";
import BoardView from "./BoardView";
import TimelineView from "./TimelineView";
import RecalibrationBanner from "./RecalibrationBanner";
import AheadOfPaceBanner from "./AheadOfPaceBanner";
import NotesPanel from "./NotesPanel";
import ProjectIconButton from "./ProjectIconButton";

const DAY_MS = 24 * 60 * 60 * 1000;

function SparkleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path
        d="M8 1.5 9.2 5.3 13 6.5l-3.8 1.2L8 11.5 6.8 7.7 3 6.5l3.8-1.2L8 1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path
        d="M2 3.5h12v7.5H6l-3 2.5v-2.5H2v-7.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function QuoteIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-4 h-4" fill="none">
      <path
        d="M6.2 4.2c-1.7.7-2.7 2-2.7 3.6 0 .3 0 .5.1.8.2-.1.4-.1.6-.1 1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8-1.9-.8-1.9-2.2c0-2.6 1.5-4.7 3.9-5.7l.3.7-.3-.7Zm6.3 0c-1.7.7-2.7 2-2.7 3.6 0 .3 0 .5.1.8.2-.1.4-.1.6-.1 1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8-1.9-.8-1.9-2.2c0-2.6 1.5-4.7 3.9-5.7l.3.7-.3-.7Z"
        fill="currentColor"
      />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
interface DashboardProps {
  project: Project;
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  onToggleTask: (projectId: string, milestoneIndex: number, taskIndex: number) => void;
  onToggleSubtask: (projectId: string, milestoneIndex: number, taskIndex: number, subtaskId: string) => void;
  onAddSubtask: (projectId: string, milestoneIndex: number, taskIndex: number, text: string) => void;
  onMoveTask: (projectId: string, milestoneIndex: number, taskIndex: number, column: BoardColumn) => void;
  onUpdateTaskText: (projectId: string, milestoneIndex: number, taskIndex: number, title: string) => void;
  onAddTask: (projectId: string, milestoneIndex: number, title: string) => void;
  onDeleteTask: (projectId: string, milestoneIndex: number, taskIndex: number) => void;
  onReorderTasks: (projectId: string, milestoneIndex: number, fromIndex: number, toIndex: number) => void;
  onUpdateMilestoneTitle: (projectId: string, milestoneIndex: number, title: string) => void;
  onAddMilestone: (projectId: string, title: string, weekLabel: number, initialTasks: string[]) => void;
  onDeleteMilestone: (projectId: string, milestoneIndex: number) => void;
  onRegenerateMilestone: (projectId: string, milestoneIndex: number, title: string, taskTexts: string[]) => void;
  onReorderMilestones: (projectId: string, fromIndex: number, toIndex: number) => void;
  onOpenChat: () => void;
  onCelebrated: (projectId: string) => void;
  onAcceptRecalibration: (projectId: string, newMilestones: Milestone[], shiftDays: number, atRisk: boolean) => void;
  onDismissRecalibration: (projectId: string) => void;
  onAcceptAcceleration: (projectId: string, newMilestones: Milestone[]) => void;
  onDismissAheadOfPace: (projectId: string) => void;
  highlightMilestoneId?: string | null;
  onUpdateNotes: (projectId: string, notes: string) => void;
  onSetIcon: (projectId: string, icon: string) => void;
  onAddNoteAttachment: (projectId: string, attachment: Attachment) => void;
  onRemoveNoteAttachment: (projectId: string, attachmentId: string) => void;
  onRecordTokens: (tokens: number) => void;
}

export default function Dashboard({
  project,
  viewMode,
  onSetViewMode,
  onToggleTask,
  onToggleSubtask,
  onAddSubtask,
  onMoveTask,
  onUpdateTaskText,
  onAddTask,
  onDeleteTask,
  onReorderTasks,
  onUpdateMilestoneTitle,
  onAddMilestone,
  onDeleteMilestone,
  onRegenerateMilestone,
  onReorderMilestones,
  onOpenChat,
  onCelebrated,
  onAcceptRecalibration,
  onDismissRecalibration,
  onAcceptAcceleration,
  onDismissAheadOfPace,
  highlightMilestoneId,
  onUpdateNotes,
  onSetIcon,
  onRecordTokens,
  onAddNoteAttachment,
  onRemoveNoteAttachment,
}: DashboardProps) {
  const allTasks = project.milestones.flatMap((m) => m.tasks);
  const doneCount = allTasks.filter((t) => t.completed).length;
  const percent = allTasks.length > 0 ? (doneCount / allTasks.length) * 100 : 0;

  // Dev-simulated drift shifts "now" forward so recalibration can be demoed
  // without waiting real days — 0 in normal use, so this is just Date.now().
  const effectiveNow = new Date(Date.now() + project.devSimulatedDriftDays * DAY_MS);

  const recalibrationProposal = proposeRecalibration(project, effectiveNow);
  const lastPrompted = project.recalibrationLastPromptedAt
    ? new Date(project.recalibrationLastPromptedAt).getTime()
    : null;
  const cooledDown = lastPrompted === null || effectiveNow.getTime() - lastPrompted > RE_PROMPT_COOLDOWN_DAYS * DAY_MS;
  const showRecalibration = recalibrationProposal !== null && cooledDown;

  // Ahead-of-pace uses its own independent cooldown field so dismissing one
  // banner never suppresses the other — they're different signals. Only one
  // of the two ever shows at once (recalibration wins if somehow both are
  // true), so the dashboard doesn't stack two "your schedule changed" banners.
  const aheadReport = detectAheadOfPace(project);
  const aheadLastPrompted = project.aheadPaceLastPromptedAt ? new Date(project.aheadPaceLastPromptedAt).getTime() : null;
  const aheadCooledDown =
    aheadLastPrompted === null || effectiveNow.getTime() - aheadLastPrompted > RE_PROMPT_COOLDOWN_DAYS * DAY_MS;
  const showAheadOfPace = !showRecalibration && aheadReport.isAhead && aheadCooledDown;
  const currentFocusIndex = project.milestones.findIndex(
    (m) => !(m.tasks.length > 0 && m.tasks.every((t) => t.completed))
  );

  const [enriching, setEnriching] = useState(false);

  const handleEnrichCurrentFocus = async () => {
    if (currentFocusIndex < 0) return;
    setEnriching(true);
    try {
      const res = await fetch("/api/regenerate-milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: project.goal,
          milestones: project.milestones.map((m) => ({ title: m.title, taskTexts: m.tasks.map((t) => t.text) })),
          targetIndex: currentFocusIndex,
          enrich: true,
        }),
      });
      const data = await res.json();
      if (!data.error) {
        onRegenerateMilestone(project.id, currentFocusIndex, data.title, data.tasks);
        if (data.usage) onRecordTokens(data.usage.inputTokens + data.usage.outputTokens);
      }
    } finally {
      setEnriching(false);
      onDismissAheadOfPace(project.id);
    }
  };

  // The hero headline is a large display font sized for a short title, not a
  // full run-on sentence — project.name (the auto-generated/renamed short
  // title) is what belongs here. The full goal is still shown just below.
  const headline = project.name;

  const [showGoal, setShowGoal] = useState(false);
  const [showRationale, setShowRationale] = useState(true);
  // Dashboard isn't remounted on project switch (no key at the call site), so
  // this needs its own reset — otherwise "expanded" leaks from one project to
  // whichever one you switch to next.
  useEffect(() => setShowGoal(false), [project.id]);
  useEffect(() => setShowRationale(true), [project.id]);

  // Same "first not-yet-complete milestone" definition ChecklistView uses for
  // its current-focus card — recomputed here so the greeting can name it.
  const currentFocusMilestone = project.milestones.find(
    (m) => !(m.tasks.length > 0 && m.tasks.every((t) => t.completed))
  );
  const totalWeeks = project.milestones.reduce((max, m) => Math.max(max, m.weekLabel), 1);
  const weeksElapsed = Math.max(
    1,
    Math.min(totalWeeks, Math.floor((effectiveNow.getTime() - new Date(project.createdAt).getTime()) / (7 * DAY_MS)) + 1)
  );
  const greeting =
    percent >= 100
      ? "🎉 Mission complete — every task on this plan is done."
      : currentFocusMilestone
      ? `Week ${weeksElapsed} of ${totalWeeks} — let's make progress on ${currentFocusMilestone.title.toLowerCase()}.`
      : `Week ${weeksElapsed} of ${totalWeeks}.`;

  const [showCelebration, setShowCelebration] = useState(false);
  // Guards the one-time trigger without racing the effect-cleanup/state-update
  // cycle: it flips synchronously the instant we decide to celebrate, so a
  // re-render from onCelebrated() can never re-enter this block.
  const celebratedRef = useRef(project.celebrated);

  useEffect(() => {
    if (percent >= 100 && !celebratedRef.current) {
      celebratedRef.current = true;
      setShowCelebration(true);
      onCelebrated(project.id);
      const timer = setTimeout(() => setShowCelebration(false), 2800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percent, project.id]);

  return (
    <main key={project.id} className="min-h-screen px-6 sm:px-10 py-4 sm:py-5">
      {showCelebration && (
        <>
          <Confetti />
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[210] animate-fade-up">
            <div className="card rounded-full shadow-lg px-5 py-2.5 flex items-center gap-2 text-success">
              <SparkleIcon />
              <span className="text-sm font-semibold text-ink-primary">Mission complete!</span>
            </div>
          </div>
        </>
      )}

      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {showRecalibration && recalibrationProposal && (
          <RecalibrationBanner
            proposal={recalibrationProposal}
            deadline={project.deadline}
            onAccept={() =>
              onAcceptRecalibration(
                project.id,
                recalibrationProposal.newMilestones,
                recalibrationProposal.shiftDays,
                recalibrationProposal.atRisk
              )
            }
            onDismiss={() => onDismissRecalibration(project.id)}
          />
        )}

        {showAheadOfPace && (
          <AheadOfPaceBanner
            report={aheadReport}
            enriching={enriching}
            onAccelerate={() => {
              onAcceptAcceleration(project.id, proposeAcceleration(project, effectiveNow));
            }}
            onEnrich={handleEnrichCurrentFocus}
            onDismiss={() => onDismissAheadOfPace(project.id)}
          />
        )}

        <header className="flex flex-col gap-3 animate-fade-up">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <ProjectIconButton icon={project.icon} onSelect={(icon) => onSetIcon(project.id, icon)} size="xs" />
                {project.goal !== project.name ? (
                  <button
                    onClick={() => setShowGoal((v) => !v)}
                    className="min-w-0 text-left group"
                    aria-expanded={showGoal}
                    title="Click to show the original prompt"
                  >
                    <h1 className="truncate text-sm font-bold text-ink-primary tracking-tight group-hover:text-accent transition-colors">
                      {headline}
                    </h1>
                  </button>
                ) : (
                  <h1 className="truncate text-sm font-bold text-ink-primary tracking-tight">{headline}</h1>
                )}
                <StreakBadge streakCount={project.streakCount} />
              </div>
              {showGoal && project.goal !== project.name && (
                <p className="text-sm text-ink-faint max-w-2xl mt-2 leading-snug">{project.goal}</p>
              )}
              <p className="text-sm text-ink-secondary mt-1.5">{greeting}</p>
            </div>
            <button
              data-tour="chat"
              onClick={onOpenChat}
              className="shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full border border-line text-ink-secondary text-sm font-medium hover:border-accent hover:text-accent hover:bg-accent-soft transition-colors"
            >
              <ChatIcon />
              AI Chat
            </button>
          </div>

          {project.planRationale && (
            showRationale ? (
              <div className="max-w-2xl rounded-2xl border border-accent/30 bg-accent-soft px-5 py-4 flex items-start gap-3">
                <span className="shrink-0 mt-0.5 text-accent">
                  <QuoteIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow text-accent mb-1">Why this plan</p>
                  <p className="text-sm text-ink-primary leading-snug">{project.planRationale}</p>
                </div>
                <button
                  onClick={() => setShowRationale(false)}
                  className="shrink-0 rounded p-1 text-accent/60 hover:text-accent hover:bg-accent-soft transition-colors"
                  aria-label="Hide why this plan"
                  title="Hide"
                >
                  <CloseIcon />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowRationale(true)}
                className="self-start flex items-center gap-1.5 text-xs font-medium text-ink-faint hover:text-accent transition-colors"
              >
                <QuoteIcon />
                Why this plan
              </button>
            )
          )}

          <div data-tour="progress" className="flex flex-wrap items-center gap-2 max-w-xl">
            <div className="w-28 shrink-0">
              <ProgressBar percent={percent} complete={percent >= 100} />
            </div>
            <ProjectionsPanel project={project} percent={percent} now={effectiveNow} />
            {project.deadline && <DeadlineBadge deadline={project.deadline} />}
          </div>

          <ViewSwitcher view={viewMode} onChange={onSetViewMode} />
        </header>

        {viewMode === "checklist" && (
          <ChecklistView
            project={project}
            onToggleTask={(i, taskIndex) => onToggleTask(project.id, i, taskIndex)}
            onToggleSubtask={(i, taskIndex, subtaskId) => onToggleSubtask(project.id, i, taskIndex, subtaskId)}
            onAddSubtask={(i, taskIndex, text) => onAddSubtask(project.id, i, taskIndex, text)}
            onUpdateTaskText={(i, taskIndex, title) => onUpdateTaskText(project.id, i, taskIndex, title)}
            onAddTask={(i, title) => onAddTask(project.id, i, title)}
            onDeleteTask={(i, taskIndex) => onDeleteTask(project.id, i, taskIndex)}
            onReorderTasks={(i, from, to) => onReorderTasks(project.id, i, from, to)}
            onUpdateMilestoneTitle={(i, title) => onUpdateMilestoneTitle(project.id, i, title)}
            onAddMilestone={(title, weekLabel, initialTasks) => onAddMilestone(project.id, title, weekLabel, initialTasks)}
            onDeleteMilestone={(i) => onDeleteMilestone(project.id, i)}
            onRegenerateMilestone={(i, title, taskTexts) => onRegenerateMilestone(project.id, i, title, taskTexts)}
            onReorderMilestones={(from, to) => onReorderMilestones(project.id, from, to)}
            highlightMilestoneId={highlightMilestoneId}
            onRecordTokens={onRecordTokens}
          />
        )}

        {viewMode === "board" && (
          <BoardView
            milestones={project.milestones}
            onMoveTask={(milestoneIndex, taskIndex, column) => onMoveTask(project.id, milestoneIndex, taskIndex, column)}
          />
        )}

        {viewMode === "timeline" && (
          <TimelineView
            project={project}
            onToggleTask={(milestoneIndex, taskIndex) => onToggleTask(project.id, milestoneIndex, taskIndex)}
          />
        )}

        {viewMode === "notes" && (
          <NotesPanel
            projectId={project.id}
            notes={project.notes}
            attachments={project.noteAttachments}
            onSave={onUpdateNotes}
            onAddAttachment={onAddNoteAttachment}
            onRemoveAttachment={onRemoveNoteAttachment}
          />
        )}
      </div>
    </main>
  );
}
