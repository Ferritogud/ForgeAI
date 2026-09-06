import { Tier } from "./types";

export const TIER_ORDER: Tier[] = ["bronze", "gold", "platinum"];

export const TIER_LIMITS: Record<Tier, number> = {
  bronze: 2,
  gold: 8,
  platinum: Infinity,
};

/**
 * Monthly AI token budget per tier — replaces the old flat message-count
 * limit (10/100/unlimited) since messages vary a lot in size/cost and a
 * token budget tracks real API spend much more accurately. Kept at roughly
 * the same 1:10:∞ ratio as the old system.
 */
export const TOKEN_LIMITS: Record<Tier, number> = {
  bronze: 50_000,
  gold: 500_000,
  platinum: Infinity,
};

/** True once a tier's monthly token budget is exhausted — always false for unlimited tiers. */
export function isTokenLimitReached(tier: Tier, tokensUsed: number): boolean {
  const limit = TOKEN_LIMITS[tier];
  return limit !== Infinity && tokensUsed >= limit;
}

export const TIER_INFO: Record<Tier, { label: string; price: string; features: string[] }> = {
  bronze: {
    label: "Bronze",
    price: "Free",
    features: ["Up to 2 projects", "~50,000 AI tokens/mo", "Full plan generation & tracking"],
  },
  gold: {
    label: "Gold",
    price: "$5–10/mo",
    features: ["Up to 8 projects", "~500,000 AI tokens/mo", "Everything in Bronze"],
  },
  platinum: {
    label: "Platinum",
    price: "$15–20/mo",
    features: ["Unlimited projects", "Unlimited AI tokens", "Everything in Gold"],
  },
};
