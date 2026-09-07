"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GlassCard from "@/components/GlassCard";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="flex flex-col items-center mb-7">
          <h1 className="text-3xl font-bold tracking-tight text-ink-primary text-center mb-2">
            Forge<span className="text-accent">AI</span>
          </h1>
          <p className="text-ink-secondary text-sm text-center max-w-xs">
            {done ? "Your password has been updated." : "Set a new password for your account."}
          </p>
        </div>

        <GlassCard className="rounded-2xl p-6">
          {!token ? (
            <p className="text-sm text-warn">
              This reset link is missing its token — copy the full link from the email again.
            </p>
          ) : done ? (
            <button
              onClick={() => router.push("/")}
              className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition-all"
            >
              Back to sign in
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-accent transition-colors"
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-sm text-ink-primary placeholder:text-ink-faint focus:outline-none focus:border-accent transition-colors"
              />

              {error && <p className="text-xs text-warn">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Set new password
              </button>
            </form>
          )}
        </GlassCard>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
