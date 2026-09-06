import { randomUUID } from "node:crypto";
import { Pool } from "pg";

/**
 * Vercel's various Postgres/Neon integrations name the connection-string env
 * var differently depending on how the integration was installed (plain
 * "Connect Store", a custom resource prefix, etc.) — this tries every name
 * we've actually seen rather than assuming one. If none match, the error
 * message below tells you exactly what to go check in Vercel's Environment
 * Variables page.
 */
const CONNECTION_STRING_ENV_VARS = [
  "DATABASE_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "STORAGE_URL",
  "STORAGE_DATABASE_URL",
  "STORAGE_POSTGRES_URL",
];

function resolveConnectionString(): string {
  for (const name of CONNECTION_STRING_ENV_VARS) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(
    `No Postgres connection string found. Checked: ${CONNECTION_STRING_ENV_VARS.join(", ")}. ` +
      "Check your Vercel project's Environment Variables page for the actual name your database " +
      "integration created, and add it under one of these names (or tell Claude the real name)."
  );
}

// A single pool per server process — Next.js route handlers on Vercel reuse
// the same module instance across requests within one serverless instance,
// so this avoids opening a new connection per request.
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: resolveConnectionString(),
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

let usersTableReady: Promise<void> | null = null;

/** Idempotent, self-migrating — runs once per server instance rather than requiring a manual migration step. Ids are generated in application code (randomUUID) rather than relying on a Postgres extension being enabled. */
function ensureUsersTable(): Promise<void> {
  if (!usersTableReady) {
    usersTableReady = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`
      )
      .then(() => undefined);
  }
  return usersTableReady;
}

export interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
}

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  await ensureUsersTable();
  const result = await getPool().query<DbUser>("SELECT id, name, email, password_hash FROM users WHERE email = $1", [
    email.toLowerCase().trim(),
  ]);
  return result.rows[0] ?? null;
}

export async function createUser(name: string, email: string, passwordHash: string | null): Promise<DbUser> {
  await ensureUsersTable();
  const result = await getPool().query<DbUser>(
    `INSERT INTO users (id, name, email, password_hash) VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, password_hash`,
    [randomUUID(), name, email.toLowerCase().trim(), passwordHash]
  );
  return result.rows[0];
}

/** Google sign-in never sets a password — this is how a Google-only account gets created (or matched) on first login. */
export async function findOrCreateGoogleUser(name: string, email: string): Promise<DbUser> {
  const existing = await findUserByEmail(email);
  if (existing) return existing;
  return createUser(name, email, null);
}

// ---------------------------------------------------------------------------
// Per-account project sync (Stage 2). Deliberately a single JSONB blob per
// user rather than a fully normalized schema (separate milestones/tasks/
// subtasks tables) — the existing app code (useProjects.ts and everything
// downstream) already works entirely in terms of the Project[] shape from
// lib/types.ts, so storing that shape directly server-side means the sync
// layer is a thin read/write on top of unchanged app logic, instead of a
// full rewrite of every hook into granular SQL. Scoped to `projects` and
// `trash` only — theme, sidebar width, badges, tier, and token usage stay
// per-browser/local, since those are device preferences, not "my work".
// ---------------------------------------------------------------------------

let userDataTableReady: Promise<void> | null = null;

function ensureUserDataTable(): Promise<void> {
  if (!userDataTableReady) {
    userDataTableReady = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS user_data (
          email TEXT PRIMARY KEY,
          projects JSONB NOT NULL DEFAULT '[]'::jsonb,
          trash JSONB NOT NULL DEFAULT '[]'::jsonb,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`
      )
      .then(() => undefined);
  }
  return userDataTableReady;
}

export interface UserData {
  projects: unknown[];
  trash: unknown[];
}

/** Null means "no row yet" — distinct from an empty array, so callers can tell "never synced" apart from "synced, genuinely has zero projects." */
export async function loadUserData(email: string): Promise<UserData | null> {
  await ensureUserDataTable();
  const result = await getPool().query<{ projects: unknown[]; trash: unknown[] }>(
    "SELECT projects, trash FROM user_data WHERE email = $1",
    [email.toLowerCase().trim()]
  );
  return result.rows[0] ?? null;
}

export async function saveUserData(email: string, projects: unknown[], trash: unknown[]): Promise<void> {
  await ensureUserDataTable();
  await getPool().query(
    `INSERT INTO user_data (email, projects, trash, updated_at) VALUES ($1, $2, $3, now())
     ON CONFLICT (email) DO UPDATE SET projects = $2, trash = $3, updated_at = now()`,
    [email.toLowerCase().trim(), JSON.stringify(projects), JSON.stringify(trash)]
  );
}
