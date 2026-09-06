"use client";

import { FormEvent, useState } from "react";
import { AuthProvider, MockUser } from "@/lib/types";
import GlassCard from "./GlassCard";

interface SignInScreenProps {
  onSignIn: (user: MockUser) => void;
}

// Matches the ~1.8s mock delay used for plan generation (GeneratingScreen) —
// long enough to read as "doing something," short enough not to annoy.
const MOCK_SIGN_IN_DELAY_MS = 1500;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 384 512" fill="currentColor" className="shrink-0">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 4 184.8 4 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function SpinnerIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 animate-spin shrink-0 ${className}`}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Create-account mode with no name entered still needs a display name — derive one from the email's local part. */
function deriveNameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const words = local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1));
  return words.join(" ") || "Demo User";
}

export default function SignInScreen({ onSignIn }: SignInScreenProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loadingProvider, setLoadingProvider] = useState<AuthProvider | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const busy = loadingProvider !== null;

  const handleOAuth = async (provider: "google" | "apple") => {
    if (busy) return;
    setError("");
    setLoadingProvider(provider);

    // TODO: replace with real Google OAuth / Sign in with Apple (e.g. via
    // NextAuth.js) once there's a real backend to issue sessions against.
    await new Promise((resolve) => setTimeout(resolve, MOCK_SIGN_IN_DELAY_MS));

    onSignIn({
      name: "Demo User",
      email: "demo@example.com",
      provider,
    });
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
      setError("Enter an email and password to continue.");
      return;
    }

    setError("");
    setLoadingProvider("email");

    // TODO: replace with real email/password auth (e.g. NextAuth.js
    // credentials provider + a real backend) — this accepts any non-empty
    // input and never actually checks the password.
    await new Promise((resolve) => setTimeout(resolve, MOCK_SIGN_IN_DELAY_MS));

    onSignIn({
      name: name.trim() || deriveNameFromEmail(trimmedEmail),
      email: trimmedEmail,
      provider: "email",
    });
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center mb-7">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex h-2 w-2 rounded-full bg-accent" />
            <span className="eyebrow">System Online</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-primary text-center mb-2">
            Forge<span className="text-accent">AI</span>
          </h1>
          <p className="text-ink-secondary text-sm text-center max-w-xs">
            Sign in to pick up your execution plans where you left off.
          </p>
        </div>

        <GlassCard className="rounded-2xl p-6">
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={busy}
              className="flex items-center justify-center gap-3 w-full rounded-lg border border-[#dadce0] bg-white px-4 py-2.5 text-sm font-medium text-[#3c4043] shadow-sm hover:shadow-md transition-shadow disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-sm"
            >
              {loadingProvider === "google" ? <SpinnerIcon className="text-[#3c4043]" /> : <GoogleIcon />}
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("apple")}
              disabled={busy}
              className="flex items-center justify-center gap-3 w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white hover:bg-black/85 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingProvider === "apple" ? <SpinnerIcon className="text-white" /> : <AppleIcon />}
              Continue with Apple
            </button>
          </div>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-line" />
            <span className="eyebrow">or</span>
            <div className="flex-1 h-px bg-line" />
          </div>

          <div className="flex rounded-lg bg-card-muted p-1 mb-4">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                mode === "signin" ? "bg-card text-ink-primary shadow-sm" : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                mode === "signup" ? "bg-card text-ink-primary shadow-sm" : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2.5">
            {mode === "signup" && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (optional)"
                autoComplete="name"
                className="w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-accent transition-colors"
              />
            )}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-accent transition-colors"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-accent transition-colors"
            />

            {error && <p className="text-xs text-warn">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex items-center justify-center gap-2 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white enabled:hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingProvider === "email" && <SpinnerIcon className="text-white" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </GlassCard>

        <p className="eyebrow text-center mt-6">Mock sign-in — no real account is created</p>
      </div>
    </main>
  );
}
