import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetToken, findUserByEmail } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "Enter your email." }, { status: 400 });
  }

  // Always respond the same way whether or not the account exists, and
  // whether or not it's a Google-only account with no password to reset —
  // otherwise this endpoint becomes a way to enumerate registered emails.
  const genericResponse = NextResponse.json({
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  });

  try {
    const user = await findUserByEmail(email);
    if (!user || !user.password_hash) return genericResponse;

    const token = await createPasswordResetToken(user.email);
    const origin = req.nextUrl.origin;
    const resetUrl = `${origin}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  } catch (err) {
    // Swallow and log server-side rather than exposing email-provider
    // failures to the client, which would also leak account existence.
    console.error("forgot-password failed:", err);
  }

  return genericResponse;
}
