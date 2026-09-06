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
