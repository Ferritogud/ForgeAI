import { Project } from "./types";
import { computeProjection } from "./projections";

type ChatProjectInput = Pick<Project, "goal" | "milestones" | "createdAt">;

/**
 * Keyword-based canned replies, same philosophy as mockGenerator.ts — no real
 * model call, but the response pulls real numbers from the project so it
 * doesn't read like a generic chatbot.
 */
export function generateMockChatReply(project: ChatProjectInput, userMessage: string): string {
  const msg = userMessage.toLowerCase();
  const allTasks = project.milestones.flatMap((m) => m.tasks);
  const doneCount = allTasks.filter((t) => t.completed).length;
  const total = allTasks.length;
  const percent = total > 0 ? (doneCount / total) * 100 : 0;
  const projection = computeProjection(project, percent);

  const matchedMilestone = project.milestones.find((m) => msg.includes(m.title.toLowerCase()));
  if (matchedMilestone) {
    const mDone = matchedMilestone.tasks.filter((t) => t.completed).length;
    const mTotal = matchedMilestone.tasks.length;
    const nextTask = matchedMilestone.tasks.find((t) => !t.completed);
    const status =
      mTotal > 0 && mDone === mTotal
        ? "That one's fully wrapped."
        : nextTask
          ? `Next up there: "${nextTask.text}".`
          : "";
    return `"${matchedMilestone.title}" is due Week ${matchedMilestone.weekLabel} and sits at ${mDone}/${mTotal} tasks complete. ${status}`;
  }

  if (/why.*(behind|late|slow)|behind schedule|falling behind/.test(msg)) {
    if (projection.trend === "behind") {
      return `You're behind pace right now — ${Math.round(percent)}% complete (${doneCount}/${total} tasks), and the projected finish (${projection.label}) trails your original plan. The fastest fix is usually clearing one task in whichever milestone still has zero progress.`;
    }
    if (projection.trend === "ahead") {
      return `Actually you're ahead of pace — ${Math.round(percent)}% done (${doneCount}/${total} tasks) and tracking to finish before ${projection.label}. Keep it up.`;
    }
    if (projection.trend === "unknown") {
      return `Too early to tell — no tasks are checked off yet on "${project.goal}". Complete one and I can give you a real pace read.`;
    }
    return `You're on track — ${Math.round(percent)}% complete (${doneCount}/${total} tasks), pacing toward ${projection.label}.`;
  }

  if (/what.*(should|do).*next|next task|next step/.test(msg)) {
    const nextMilestone = project.milestones.find((m) => m.tasks.some((t) => !t.completed));
    const nextTask = nextMilestone?.tasks.find((t) => !t.completed);
    if (nextTask && nextMilestone) {
      return `Your next open task is "${nextTask.text}" under "${nextMilestone.title}" (Week ${nextMilestone.weekLabel}).`;
    }
    return `Every task across all ${project.milestones.length} milestones is checked off — "${project.goal}" is done.`;
  }

  if (/add.*(task|to-?do|item)/.test(msg)) {
    return `Noted. Heads up though — in this demo the chat can't edit the plan directly yet, so add it from the milestone card and it'll show up in your progress right away.`;
  }

  if (/progress|status|how.*(doing|going|far)/.test(msg)) {
    const trendText = projection.trend === "unknown" ? "just getting started" : projection.trend.replace("-", " ");
    return `"${project.goal}" is at ${Math.round(percent)}% (${doneCount}/${total} tasks) across ${project.milestones.length} milestones — currently ${trendText}.`;
  }

  const trendText = projection.trend === "unknown" ? "no projection yet" : `projected to finish ${projection.label}`;
  return `Here's where things stand on "${project.goal}": ${Math.round(percent)}% complete (${doneCount}/${total} tasks), ${trendText}. Ask me about a specific milestone, or what's next.`;
}
