"use client";

import { useCallback, useEffect, useState } from "react";
import { MockUser } from "@/lib/types";
import { loadMockUser, saveMockUser, clearMockUser } from "@/lib/storage";

/**
 * Mock sign-in only — no real session, token, or backend. Signing out clears
 * just this local record, never the user's projects, so re-signing in (even
 * via a different mock provider) brings the same data back.
 */
export function useAuth() {
  const [user, setUser] = useState<MockUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(loadMockUser());
    setReady(true);
  }, []);

  const signIn = useCallback((next: MockUser) => {
    setUser(next);
    saveMockUser(next);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    clearMockUser();
  }, []);

  return { user, ready, signIn, signOut };
}
