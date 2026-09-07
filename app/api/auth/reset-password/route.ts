import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { consumePasswordResetToken, updateUserPassword } from "@/lib/db";
import { getClientIp, isRateLimited } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  if (isRateLimited(`reset-password:${getClientIp(req)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts — try again later." }, { status: 429 });
  }

  const { token, password } = await req.json();

  if (typeof token !== "string" || !token.trim()) {
    return NextResponse.json({ error: "Missing reset token." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
  }

  const email = await consumePasswordResetToken(token);
  if (!email) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await updateUserPassword(email, passwordHash);

  return NextResponse.json({ ok: true });
}
