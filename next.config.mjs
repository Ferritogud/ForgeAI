import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withSentryConfig(nextConfig, {
  org: "forgeai-at",
  project: "forgeai",
  // Only used to upload source maps for readable stack traces — safe to
  // silence locally/in CI when SENTRY_AUTH_TOKEN isn't set (build still
  // succeeds, just without source-mapped traces).
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  // No SENTRY_AUTH_TOKEN is configured, so skip the source-map upload step
  // entirely instead of letting it fail the build trying to authenticate.
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
