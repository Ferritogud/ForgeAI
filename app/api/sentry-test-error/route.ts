// Temporary — verifies Sentry is actually receiving server-side errors.
// Delete this route once confirmed in the Sentry Issues dashboard.
export async function GET() {
  throw new Error("Sentry test error — safe to ignore, this route is temporary.");
}
