"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "forgeai_onboarding_complete";

/** First-run tutorial completion flag. Defaults to "done" until the localStorage read resolves, so nothing flashes before hydration. */
export function useOnboarding() {
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(true);

  useEffect(() => {
    setDone(localStorage.getItem(KEY) === "true");
    setReady(true);
  }, []);

  const complete = useCallback(() => {
    localStorage.setItem(KEY, "true");
    setDone(true);
  }, []);

  const replay = useCallback(() => {
    localStorage.removeItem(KEY);
    setDone(false);
  }, []);

  return { ready, done, complete, replay };
}
