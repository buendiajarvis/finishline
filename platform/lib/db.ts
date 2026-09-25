/**
 * Shared Postgres layer — server-only, optional.
 *
 * When `DATABASE_URL` is set, the small JSON stores (CRM, leads) persist to
 * Postgres instead of the local filesystem — the only way they survive on
 * Vercel (read-only FS, ephemeral). When unset (local dev), callers fall back
 * to their JSON files and nothing here runs.
 *
 * `postgres` is a STATIC import on purpose so the bundler includes it in the
 * serverless function. CRM is a small "document" store: it persists as a single
 * JSONB blob row, so all read-modify-write logic is preserved and only the
 * persistence layer swaps. Leads use their own append-only table.
 */
import postgres from "postgres";

type Sql = ReturnType<typeof postgres>;

export function dbEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

// undefined = not yet attempted, null = unavailable, Sql = ready (cached per process).
let _sql: Sql | null | undefined;

/** Cached Postgres client, or null when DATABASE_URL is unset / construction
 *  fails. Do NOT call sql.end() on this — it's shared and reused. */
export function getSql(): Sql | null {
  if (!process.env.DATABASE_URL) return null;
  if (_sql !== undefined) return _sql;
  try {
    _sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 20 });
  } catch {
    _sql = null;
  }
  return _sql;
}

// Ensure each blob table once per cold start.
const _ensured = new Set<string>();

async function ensureBlobTable(sql: Sql, table: string): Promise<void> {
  if (_ensured.has(table)) return;
  await sql`CREATE TABLE IF NOT EXISTS ${sql(table)} (
    id int primary key default 1,
    data jsonb not null,
    updated_at timestamptz not null default now()
  )`;
  _ensured.add(table);
}

/**
 * Read a single-row JSONB document store. Returns `fallback` when the DB is
 * reachable but empty, and `null` when there is NO database (caller then uses
 * its JSON-file fallback).
 */
export async function readBlob<T>(table: string, fallback: T): Promise<T | null> {
  const sql = getSql();
  if (!sql) return null;
  await ensureBlobTable(sql, table);
  const rows = await sql<{ data: T }[]>`select data from ${sql(table)} where id = 1`;
  return rows[0]?.data ?? fallback;
}

/** Write a single-row JSONB document store. Returns true if persisted, false
 *  when there is no database (caller then uses its JSON fallback). */
export async function writeBlob(table: string, data: unknown): Promise<boolean> {
  const sql = getSql();
  if (!sql) return false;
  await ensureBlobTable(sql, table);
  await sql`insert into ${sql(table)} (id, data, updated_at)
    values (1, ${sql.json(data as never)}, now())
    on conflict (id) do update set data = ${sql.json(data as never)}, updated_at = now()`;
  return true;
}
