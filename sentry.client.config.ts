// Runs in the browser — catches unhandled errors in client components.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Keep this low — it's the % of *successful* page loads traced for
  // performance data, not error reporting (errors are always captured
  // regardless of this setting).
  tracesSampleRate: 0.1,
  debug: false,
});
