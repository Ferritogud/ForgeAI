/**
 * Resolves which Anthropic API key an API route should use, and enforces a
 * soft daily spend cap ONLY when it's the site's own shared key doing the
 * work — never when a visitor supplied their own key in Settings, since
 * that's their account/their money, not ours to ration.
 *
 * The cap is a defense-in-depth layer against a traffic spike or abuse
 * loop, not the primary guarantee — the real, reliable ceiling is the
 * monthly spend limit set directly on the key at
 * console.anthropic.com/settings/limits, which Anthropic enforces
 * server-side regardless of anything in this file. This in-memory counter
 * is best-effort: serverless platforms (Vercel included) can spin up
 * multiple instances that don't share this module's state, so under real
 * concurrent load this throttles "most" traffic rather than "all" of it.
 * That's an acceptable second layer on top of the hard billing cap above,
 * not a replacement for it.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Override with a DAILY_TOKEN_CAP env var in Vercel if you want a different ceiling than this default. */
const DEFAULT_DAILY_TOKEN_CAP = 300_000;

function dailyTokenCap(): number {
  const raw = process.env.DAILY_TOKEN_CAP;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_DAILY_TOKEN_CAP;
}

let windowStart = Date.now();
let tokensUsedInWindow = 0;

function rolloverIfNeeded() {
  if (Date.now() - windowStart > DAY_MS) {
    windowStart = Date.now();
    tokensUsedInWindow = 0;
  }
}

export function canUseServerKey(): boolean {
  rolloverIfNeeded();
  return tokensUsedInWindow < dailyTokenCap();
}

export function recordServerUsage(tokens: number): void {
  rolloverIfNeeded();
  tokensUsedInWindow += Math.max(0, tokens);
}

export interface ResolvedKey {
  key: string;
  /** True when this is the site's own ANTHROPIC_API_KEY env var, not something the visitor typed in — this is what the daily cap gates. */
  usesServerKey: boolean;
}

/** A visitor-supplied key always wins (it's their account) — the server's shared key is only the fallback for visitors who never brought their own. */
export function resolveApiKey(clientKey: string | null | undefined): ResolvedKey {
  const trimmedClientKey = (clientKey ?? "").trim();
  if (trimmedClientKey) return { key: trimmedClientKey, usesServerKey: false };

  const serverKey = (process.env.ANTHROPIC_API_KEY ?? "").trim();
  return { key: serverKey, usesServerKey: true };
}
