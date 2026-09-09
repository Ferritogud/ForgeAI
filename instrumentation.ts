// Next.js calls this once per runtime on startup — this is how the two
// separate Sentry configs above (server vs. edge) each get loaded into the
// right runtime instead of bundling both into every environment.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
