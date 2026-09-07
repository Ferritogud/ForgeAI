import { NextRequest, NextResponse } from "next/server";
import { Tier } from "@/lib/types";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

/**
 * Codes live in a single JSON env var so new ones can be handed out (or
 * revoked) without a code change — just update PLAN_CODES in Vercel and
 * redeploy. Format: {"CODE":"gold"|"platinum", ...}. Matching is
 * case-insensitive since codes are typically shared verbally/in DMs.
 */
function loadCodeMap(): Record<string, Tier> {
  const raw = process.env.PLAN_CODES ?? "";
  if (!raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    const map: Record<string, Tier> = {};
    for (const [code, tier] of Object.entries(parsed)) {
      if ((tier === "gold" || tier === "platinum") && typeof code === "string") {
        map[code.trim().toUpperCase()] = tier;
      }
    }
    return map;
  } catch {
    return {};
  }
}

export async function POST(req: NextRequest) {
  if (isRateLimited(`redeem-code:${getClientIp(req)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ error: "Enter a code." }, { status: 400 });
  }

  const tier = loadCodeMap()[code.trim().toUpperCase()];
  if (!tier) {
    return NextResponse.json({ error: "That code isn't valid." }, { status: 404 });
  }

  return NextResponse.json({ tier });
}
