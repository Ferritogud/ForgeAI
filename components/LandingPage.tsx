"use client";

function RoadmapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M4 6h16M4 6a2 2 0 1 1 0-.001M4 12h10M4 12a2 2 0 1 1 0-.001M4 18h16M4 18a2 2 0 1 1 0-.001"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
function RecalibrateIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M4 12a8 8 0 0 1 14.5-4.5M20 12a8 8 0 0 1-14.5 4.5M18 4v4h-4M6 20v-4h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M4 4h16v12H8l-4 4V4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SoundboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
      <path
        d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM6 11v1a6 6 0 0 0 12 0v-1M12 18v3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const FEATURES = [
  {
    icon: RoadmapIcon,
    title: "AI-generated roadmaps",
    body: "Describe any goal and get a phased plan — milestones, tasks, and a realistic timeline — built for you in seconds.",
  },
  {
    icon: RecalibrateIcon,
    title: "Adapts as you go",
    body: "Fall behind or pull ahead, and ForgeAI notices — offering to recalibrate the rest of the plan instead of letting it go stale.",
  },
  {
    icon: ChatIcon,
    title: "Chat with your plan",
    body: "Ask what to do next, get unstuck on a task, or check things off — right from a chat that knows your whole project.",
  },
  {
    icon: SoundboardIcon,
    title: "Idea Soundboard",
    body: "Not ready to commit to a plan yet? Talk through a raw idea by voice or text, no project required — on every plan, free.",
  },
];

const STEPS = [
  { n: "1", title: "Describe your goal", body: "One sentence is enough — a deadline is optional." },
  { n: "2", title: "Get your plan", body: "AI builds a phased roadmap with real, checkable tasks." },
  { n: "3", title: "Track & adapt", body: "Check things off, and let ForgeAI keep the plan honest." },
];

export default function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <span className="text-lg font-bold tracking-tight text-ink-primary">
          Forge<span className="text-accent">AI</span>
        </span>
        <button
          onClick={onGetStarted}
          className="text-sm font-medium text-ink-secondary hover:text-accent transition-colors"
        >
          Sign in
        </button>
      </header>

      {/* Hero */}
      <section className="px-6 pt-10 pb-16 max-w-3xl mx-auto text-center flex flex-col items-center">
        <div className="flex items-center gap-2 mb-5">
          <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
          <span className="eyebrow">System Online</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink-primary text-balance mb-5">
          Turn any goal into a plan that <span className="text-accent">adapts as you move</span>
        </h1>
        <p className="text-ink-secondary text-base sm:text-lg max-w-xl mb-8 text-balance">
          ForgeAI turns a one-line goal into a real execution plan — then tells you when you&apos;re
          falling behind, instead of quietly letting it rot.
        </p>
        <button
          onClick={onGetStarted}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:brightness-110 transition-all"
        >
          Get started — it&apos;s free
        </button>
        <p className="text-xs text-ink-faint mt-3">No credit card required.</p>
      </section>

      {/* Features */}
      <section className="px-6 py-14 border-t border-line">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-5">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card rounded-2xl p-5 flex flex-col gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-accent-soft text-accent">
                <Icon />
              </span>
              <h3 className="text-base font-semibold text-ink-primary">{title}</h3>
              <p className="text-sm text-ink-secondary leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-14 border-t border-line bg-card-muted">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-ink-primary mb-10">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center gap-2">
                <span className="w-8 h-8 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center">
                  {s.n}
                </span>
                <h3 className="text-sm font-semibold text-ink-primary mt-1">{s.title}</h3>
                <p className="text-xs text-ink-secondary leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 border-t border-line text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-ink-primary mb-4 text-balance">
          Stop planning. Start doing.
        </h2>
        <button
          onClick={onGetStarted}
          className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:brightness-110 transition-all"
        >
          Get started — it&apos;s free
        </button>
      </section>

      <footer className="px-6 py-8 border-t border-line text-center">
        <p className="text-xs text-ink-faint">
          <a href="/terms" className="hover:text-accent transition-colors underline underline-offset-2">
            Terms
          </a>
          {" · "}
          <a href="/privacy" className="hover:text-accent transition-colors underline underline-offset-2">
            Privacy Policy
          </a>
        </p>
      </footer>
    </main>
  );
}
