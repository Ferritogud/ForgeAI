"use client";

import { CSSProperties, useEffect, useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/hooks/useAuth";
import { useTier } from "@/hooks/useTier";
import { useTokenUsage } from "@/hooks/useTokenUsage";
import { useTheme } from "@/hooks/useTheme";
import { useViewMode } from "@/hooks/useViewMode";
import { useSidebarWidth } from "@/hooks/useSidebarWidth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useBadges } from "@/hooks/useBadges";
import { generateProjectTitle, getApiKey } from "@/lib/ai";
import { isTokenLimitReached } from "@/lib/tiers";
import { PROJECT_TEMPLATES } from "@/lib/templates";
import { EMPTY_GOAL_CONTEXT, GoalContext } from "@/lib/goalContext";
import Sidebar from "./Sidebar";
import SignInScreen from "./SignInScreen";
import InputScreen from "./InputScreen";
import QuestionFlow, { QuestionAnswer } from "./QuestionFlow";
import ConfirmationScreen from "./ConfirmationScreen";
import GeneratingScreen from "./GeneratingScreen";
import Dashboard from "./Dashboard";
import SettingsPanel from "./SettingsPanel";
import ChatPanel from "./ChatPanel";
import UpsellModal from "./UpsellModal";
import OnboardingTour, { ONBOARDING_STEPS, TourStep } from "./OnboardingTour";
import CommandPalette from "./CommandPalette";
import ActivityModal from "./ActivityModal";
import BadgesModal from "./BadgesModal";
import DigestModal from "./DigestModal";
import BadgeToast from "./BadgeToast";

type Mode = "input" | "questions" | "confirm" | "generating" | "dashboard";
type SettingsTab = "general" | "plan" | "trash";

function MenuIcon() {
  return (
    <svg viewBox="0 0 20 20" className="w-5 h-5" fill="none">
      <path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function AppShell() {
  const {
    ready,
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    createProject,
    deleteProject,
    renameProject,
    toggleTask,
    addSubtask,
    toggleSubtask,
    moveTask,
    updateTaskText,
    addTask,
    deleteTask,
    reorderTasks,
    updateMilestoneTitle,
    addMilestone,
    deleteMilestone,
    regenerateMilestone,
    reorderMilestones,
    markCelebrated,
    addChatMessage,
    clearAllProjects,
    replaceAllProjects,
    trash,
    restoreTrashEntry,
    permanentlyDeleteTrashEntry,
    emptyTrash,
    applyRecalibration,
    dismissRecalibration,
    applyAcceleration,
    dismissAheadOfPace,
    setDevSimulatedDrift,
    updateNotes,
    setProjectIcon,
    addNoteAttachment,
    removeNoteAttachment,
  } = useProjects();
  const auth = useAuth();
  const { tier, setTier, limit } = useTier();
  const { usage: tokenUsage, recordTokens } = useTokenUsage();
  const { theme, setTheme } = useTheme();
  const { viewMode, setViewMode } = useViewMode();
  const { width: sidebarWidth, setWidth: setSidebarWidth } = useSidebarWidth();
  const onboarding = useOnboarding();
  const badges = useBadges();

  const [mode, setMode] = useState<Mode>("dashboard");
  const [pendingGoal, setPendingGoal] = useState("");
  const [pendingDeadline, setPendingDeadline] = useState<string | undefined>(undefined);
  const [pendingContext, setPendingContext] = useState<GoalContext>(EMPTY_GOAL_CONTEXT);
  const [pendingAnswers, setPendingAnswers] = useState<QuestionAnswer[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarResizing, setSidebarResizing] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");
  const [chatOpen, setChatOpen] = useState(false);
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [highlightMilestoneId, setHighlightMilestoneId] = useState<string | null>(null);
  const [tourSteps, setTourSteps] = useState<TourStep[] | null>(null);
  const [tourIndex, setTourIndex] = useState(0);
  const [activityOpen, setActivityOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [digestOpen, setDigestOpen] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const effectiveMode: Mode =
    ready && projects.length === 0 && mode !== "generating" && mode !== "questions" && mode !== "confirm"
      ? "input"
      : mode;

  // First-run tutorial: start it once ready, skipping the goal-input step if
  // the user already has projects (they won't see the empty InputScreen).
  useEffect(() => {
    if (!ready || !onboarding.ready || onboarding.done) return;
    setTourSteps(projects.length === 0 ? ONBOARDING_STEPS : ONBOARDING_STEPS.slice(1));
    setTourIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, onboarding.ready]);

  // The goal-input step only exists on the empty-state InputScreen — once the
  // user generates their first plan and lands on the dashboard, resume the
  // tour at the next step automatically.
  useEffect(() => {
    if (tourSteps && tourIndex === 0 && tourSteps[0]?.screen === "input" && effectiveMode === "dashboard") {
      setTourIndex(1);
    }
  }, [effectiveMode, tourSteps, tourIndex]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
      // Cmd+, / Ctrl+, opens Settings directly, same shortcut Claude uses —
      // "," never collides with the Cmd/Ctrl+K palette toggle above.
      if ((e.metaKey || e.ctrlKey) && e.key === ",") {
        e.preventDefault();
        setSettingsTab("general");
        setSettingsOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!highlightMilestoneId) return;
    const timer = setTimeout(() => setHighlightMilestoneId(null), 2500);
    return () => clearTimeout(timer);
  }, [highlightMilestoneId]);

  useEffect(() => {
    document.title = activeProject ? `${activeProject.name} — ForgeAI` : "ForgeAI — Adaptive Execution Plans";
  }, [activeProject]);

  // Condition-based badges — re-evaluated whenever project state changes.
  // award() is a no-op for anything already earned, so this is safe to run
  // on every projects update rather than needing a trigger per achievement.
  useEffect(() => {
    if (!ready || !badges.ready) return;
    if (projects.length >= 1) badges.award("fresh-start");
    if (projects.some((p) => p.milestones.some((m) => m.tasks.some((t) => t.completed)))) {
      badges.award("first-task");
    }
    if (projects.some((p) => p.milestones.some((m) => m.tasks.length > 0 && m.tasks.every((t) => t.completed)))) {
      badges.award("milestone-master");
    }
    if (projects.some((p) => p.celebrated)) badges.award("mission-complete");
    const maxStreak = Math.max(0, ...projects.map((p) => p.streakCount));
    if (maxStreak >= 3) badges.award("streak-3");
    if (maxStreak >= 7) badges.award("streak-7");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, ready, badges.ready]);

  const activeTourStep = tourSteps ? tourSteps[tourIndex] : null;
  const showTourStep =
    activeTourStep &&
    ((activeTourStep.screen === "input" && effectiveMode === "input") ||
      (activeTourStep.screen === "dashboard" && effectiveMode === "dashboard" && !!activeProject));

  const handleTourNext = () => {
    if (!tourSteps) return;
    if (tourIndex >= tourSteps.length - 1) {
      onboarding.complete();
      setTourSteps(null);
    } else {
      setTourIndex((i) => i + 1);
    }
  };

  const handleTourSkip = () => {
    onboarding.complete();
    setTourSteps(null);
  };

  const handleReplayTutorial = () => {
    onboarding.replay();
    setSettingsOpen(false);
    setTourSteps(projects.length === 0 ? ONBOARDING_STEPS : ONBOARDING_STEPS.slice(1));
    setTourIndex(0);
  };

  const handleNavigateToResult = (projectId: string, milestoneId: string) => {
    setActiveProjectId(projectId);
    setViewMode("checklist");
    setMode("dashboard");
    setHighlightMilestoneId(milestoneId);
  };

  const openSettings = (tab: SettingsTab = "general") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  const handleNewProject = () => {
    if (projects.length >= limit) {
      setUpsellOpen(true);
      setMobileOpen(false);
      return;
    }
    setMode("input");
    setMobileOpen(false);
  };

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setMode("dashboard");
    setMobileOpen(false);
  };

  // Entry point from the main input screen: instead of generating right
  // away, transition to the clarifying-questions step. The budget check
  // happens here (not after questions) so a maxed-out account doesn't waste
  // a real API call asking questions for a plan it's about to refuse to
  // generate anyway.
  const handleStartGeneration = (goal: string, deadline?: string, context?: GoalContext) => {
    const apiKey = getApiKey();

    if (apiKey && isTokenLimitReached(tier, tokenUsage.tokensUsed)) {
      setGenerationError(
        "You've used all your AI tokens this month — upgrade in Settings for more, or remove your API key to keep generating demo plans for free."
      );
      return;
    }

    setPendingGoal(goal);
    setPendingDeadline(deadline);
    setPendingContext(context ?? EMPTY_GOAL_CONTEXT);
    setGenerationError(null);
    setMode("questions");
  };

  const runGeneration = async (
    goal: string,
    deadline: string | undefined,
    context: GoalContext,
    answers: QuestionAnswer[]
  ) => {
    setMode("generating");
    setGenerationError(null);

    const minDelay = new Promise((resolve) => setTimeout(resolve, 1800));
    const fetchPromise = fetch("/api/generate-roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, apiKey: getApiKey(), answers, context, deadline }),
    }).then((res) => res.json());
    // Runs alongside the roadmap call rather than after it, so auto-titling
    // doesn't add its own extra wait on top of plan generation.
    const titlePromise = generateProjectTitle(goal);

    const [data, title] = await Promise.all([fetchPromise, titlePromise, minDelay]);

    if (data.error) {
      setGenerationError(data.error);
      setMode("input");
      return;
    }

    if (data.usage) {
      recordTokens(data.usage.inputTokens + data.usage.outputTokens);
    }

    createProject(goal, data.milestones, deadline, undefined, title, data.reasoning);
    setMode("dashboard");
  };

  // Both paths land on the confirmation screen rather than generating
  // immediately — the user gets one look at what was understood (goal +
  // structured fields + whatever answers were given) before the real
  // generation call fires.
  const handleQuestionsComplete = (answers: QuestionAnswer[]) => {
    setPendingAnswers(answers);
    setMode("confirm");
  };

  const handleSkipQuestions = () => {
    setPendingAnswers([]);
    setMode("confirm");
  };

  const handleConfirmGenerate = () => {
    runGeneration(pendingGoal, pendingDeadline, pendingContext, pendingAnswers);
  };

  // Sends the user back to re-answer the clarifying questions rather than a
  // full form-review/edit UI — simplest correct way to let them "adjust
  // something" without building a second editing surface for the same data.
  const handleAdjustAnswers = () => {
    setMode("questions");
  };

  const handleSelectTemplate = (templateId: string) => {
    const template = PROJECT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    // Templates already ship a curated, human-written label — reuse it as
    // the title instead of running it through generation for no benefit.
    createProject(template.goal, template.milestones, undefined, template.icon, template.label);
    setMode("dashboard");
  };

  const handleUpdateTaskText = (projectId: string, milestoneIndex: number, taskIndex: number, title: string) => {
    updateTaskText(projectId, milestoneIndex, taskIndex, title);
    badges.award("editor");
  };

  const handleAddTask = (projectId: string, milestoneIndex: number, title: string) => {
    addTask(projectId, milestoneIndex, title);
    badges.award("editor");
  };

  if (!ready || !auth.ready) return null;

  // Whole app is gated behind mock sign-in (rather than leaving it reachable
  // via the sidebar) — the account menu (Part B) shows the signed-in user's
  // info, so there needs to always be one by the time the dashboard renders.
  if (!auth.user) return <SignInScreen onSignIn={auth.signIn} />;

  const highlightedId = effectiveMode === "input" ? null : activeProjectId;
  const sidebarOffset = collapsed ? "md:ml-[76px]" : "md:ml-[var(--sidebar-w)]";

  return (
    <div className="min-h-screen">
      <Sidebar
        projects={projects}
        activeProjectId={highlightedId}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        width={sidebarWidth}
        onWidthChange={setSidebarWidth}
        onResizingChange={setSidebarResizing}
        onSelect={handleSelectProject}
        onNew={handleNewProject}
        onRename={renameProject}
        onDelete={deleteProject}
        onSetIcon={setProjectIcon}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenSettings={() => openSettings("general")}
        onOpenActivity={() => setActivityOpen(true)}
        onOpenBadges={() => setBadgesOpen(true)}
        onOpenDigest={() => setDigestOpen(true)}
        user={auth.user}
        tier={tier}
        earnedBadges={badges.earned}
        onSignOut={auth.signOut}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        projects={projects}
        onClearAll={clearAllProjects}
        onImport={replaceAllProjects}
        tier={tier}
        onSetTier={setTier}
        theme={theme}
        onSetTheme={setTheme}
        initialTab={settingsTab}
        trash={trash}
        onRestoreTrash={restoreTrashEntry}
        onDeleteTrashPermanently={permanentlyDeleteTrashEntry}
        onEmptyTrash={emptyTrash}
        activeProject={activeProject}
        onSetDevSimulatedDrift={setDevSimulatedDrift}
        onReplayTutorial={handleReplayTutorial}
      />

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        viewMode={viewMode}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onOpenSettings={() => openSettings("general")}
        onSetViewMode={setViewMode}
        onNavigateToResult={handleNavigateToResult}
      />

      {showTourStep && activeTourStep && (
        <OnboardingTour
          step={activeTourStep}
          stepNumber={tourIndex + 1}
          totalSteps={tourSteps?.length ?? 1}
          onNext={handleTourNext}
          onSkip={handleTourSkip}
        />
      )}

      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        project={activeProject}
        onSendMessage={addChatMessage}
        onToggleTask={(milestoneIndex, taskIndex) => {
          if (activeProject) toggleTask(activeProject.id, milestoneIndex, taskIndex);
        }}
        tier={tier}
        usage={tokenUsage}
        onRecordTokens={recordTokens}
        onUpgrade={() => {
          setChatOpen(false);
          openSettings("plan");
        }}
      />

      <UpsellModal
        open={upsellOpen}
        onClose={() => setUpsellOpen(false)}
        onViewPlans={() => {
          setUpsellOpen(false);
          openSettings("plan");
        }}
        limit={limit}
      />

      <ActivityModal open={activityOpen} onClose={() => setActivityOpen(false)} project={activeProject} />
      <BadgesModal open={badgesOpen} onClose={() => setBadgesOpen(false)} earned={badges.earned} />
      <DigestModal open={digestOpen} onClose={() => setDigestOpen(false)} project={activeProject} />
      <BadgeToast badge={badges.justEarned} />

      <div
        style={{ ["--sidebar-w" as string]: `${sidebarWidth}px` } as CSSProperties}
        className={`${sidebarResizing ? "" : "transition-[margin] duration-300"} ${sidebarOffset}`}
      >
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-line sticky top-0 z-30 bg-base/95 backdrop-blur-md">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-lg text-ink-secondary hover:text-accent"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
          <span className="text-sm font-semibold text-ink-primary">
            Forge<span className="text-accent">AI</span>
          </span>
          <span className="w-9" />
        </div>

        {effectiveMode === "input" && (
          <InputScreen onSubmit={handleStartGeneration} onSelectTemplate={handleSelectTemplate} error={generationError} />
        )}
        {effectiveMode === "questions" && (
          <QuestionFlow
            goal={pendingGoal}
            context={pendingContext}
            onComplete={handleQuestionsComplete}
            onSkip={handleSkipQuestions}
          />
        )}
        {effectiveMode === "confirm" && (
          <ConfirmationScreen
            goal={pendingGoal}
            deadline={pendingDeadline}
            context={pendingContext}
            answers={pendingAnswers}
            onGenerate={handleConfirmGenerate}
            onAdjust={handleAdjustAnswers}
          />
        )}
        {effectiveMode === "generating" && <GeneratingScreen goal={pendingGoal} />}
        {effectiveMode === "dashboard" && activeProject && (
          <Dashboard
            project={activeProject}
            viewMode={viewMode}
            onSetViewMode={setViewMode}
            onToggleTask={toggleTask}
            onToggleSubtask={toggleSubtask}
            onAddSubtask={addSubtask}
            onMoveTask={moveTask}
            onUpdateTaskText={handleUpdateTaskText}
            onAddTask={handleAddTask}
            onDeleteTask={deleteTask}
            onReorderTasks={reorderTasks}
            onUpdateMilestoneTitle={updateMilestoneTitle}
            onAddMilestone={addMilestone}
            onDeleteMilestone={deleteMilestone}
            onRegenerateMilestone={regenerateMilestone}
            onReorderMilestones={reorderMilestones}
            onOpenChat={() => setChatOpen(true)}
            onCelebrated={markCelebrated}
            onAcceptRecalibration={applyRecalibration}
            onDismissRecalibration={dismissRecalibration}
            onAcceptAcceleration={applyAcceleration}
            onDismissAheadOfPace={dismissAheadOfPace}
            highlightMilestoneId={highlightMilestoneId}
            onUpdateNotes={updateNotes}
            onSetIcon={setProjectIcon}
            onAddNoteAttachment={addNoteAttachment}
            onRemoveNoteAttachment={removeNoteAttachment}
            onRecordTokens={recordTokens}
          />
        )}
      </div>
    </div>
  );
}
