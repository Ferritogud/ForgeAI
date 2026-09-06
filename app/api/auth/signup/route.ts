import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, findUserByEmail } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (typeof email !== "string" || !email.trim() || typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "A valid email and a password of at least 6 characters are required." },
      { status: 400 }
    );
  }

  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with that email already exists — try signing in instead." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const trimmedName = typeof name === "string" ? name.trim() : "";
    await createUser(trimmedName, email, passwordHash);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong creating your account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
