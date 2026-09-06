"use client";

import { useCallback } from "react";
import { signOut as nextAuthSignOut, useSession } from "next-auth/react";
import { MockUser } from "@/lib/types";

/**
 * Thin wrapper over next-auth/react's useSession — kept as its own hook (same
 * shape as the old mock version: {user, ready, signOut}) so AppShell and
 * Sidebar didn't need to change how they consume auth state. Actual sign-IN
 * now happens inside SignInScreen itself via next-auth/react's signIn()
 * directly (Google redirect flow, or the Credentials provider for email) —
 * this hook only reflects whatever session already exists.
 */
export function useAuth() {
  const { data: session, status } = useSession();

  const user: MockUser | null =
    status === "authenticated" && session?.user
      ? {
          name: session.user.name ?? "User",
          email: session.user.email ?? "",
          provider: "email",
        }
      : null;

  const signOut = useCallback(() => {
    nextAuthSignOut({ redirect: false });
  }, []);

  return { user, ready: status !== "loading", signOut };
}
