import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { loadUserData, saveUserData } from "@/lib/db";

/** Every request here is scoped to the signed-in session's own email — never a client-supplied id — so one account can only ever read/write its own projects. */
async function requireEmail(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.email ?? null;
}

export async function GET() {
  const email = await requireEmail();
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const data = await loadUserData(email);
  // null (no row yet) is distinct from an empty-but-synced state — the
  // client uses this to decide whether to push its local data up as a
  // one-time migration, versus trusting an intentionally empty server list.
  return NextResponse.json({ data });
}

export async function PUT(req: NextRequest) {
  const email = await requireEmail();
  if (!email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { projects, trash } = await req.json();
  if (!Array.isArray(projects)) {
    return NextResponse.json({ error: "projects must be an array" }, { status: 400 });
  }

  await saveUserData(email, projects, Array.isArray(trash) ? trash : []);
  return NextResponse.json({ ok: true });
}
