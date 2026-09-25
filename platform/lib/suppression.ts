/**
 * Email suppression (unsubscribe) list.
 *
 * Anyone who unsubscribes is recorded here and must never be emailed again.
 * Unsubscribe links are HMAC-signed so a recipient can only opt out their own
 * address.
 *
 * Durability mirrors the CRM: a Postgres JSONB blob when DATABASE_URL is set
 * (the only store that survives Vercel's read-only filesystem), falling back to
 * a local JSON file in dev. addSuppression reports whether the opt-out actually
 * persisted, so the unsubscribe handler never falsely claims success.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { dbEnabled, readBlob, writeBlob } from "./db";

const STORE = path.join(process.cwd(), "data", "unsubscribed.json");
const DB_TABLE = "suppression_store";

/**
 * HMAC signing key for unsubscribe tokens. Fails CLOSED in production: a signing
 * key must never silently degrade to a public constant. In dev a fixed literal
 * keeps the outreach flow usable without configuring secrets.
 */
function secret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET || process.env.CRM_TOKEN;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("UNSUBSCRIBE_SECRET (or CRM_TOKEN) must be set to sign/verify unsubscribe tokens in production.");
  }
  return "finishline-unsubscribe-dev-only";
}

function norm(email: string): string {
  return email.trim().toLowerCase();
}

export function unsubToken(email: string): string {
  return crypto.createHmac("sha256", secret()).update(norm(email)).digest("hex").slice(0, 32);
}

export function verifyUnsubToken(email: string, token: string): boolean {
  const expected = unsubToken(email);
  if (!token || token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function unsubscribeUrl(email: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.finishlinemsp.com";
  const u = new URL("/api/unsubscribe", base);
  u.searchParams.set("email", email);
  u.searchParams.set("token", unsubToken(email));
  return u.toString();
}

type Suppressed = { email: string; at: string; reason?: string };

async function read(): Promise<Suppressed[]> {
  if (dbEnabled()) {
    const rows = await readBlob<Suppressed[]>(DB_TABLE, []);
    if (rows !== null) return Array.isArray(rows) ? rows : [];
    // null → DB configured but unreachable; fall through to local JSON.
  }
  try {
    return JSON.parse(await fs.readFile(STORE, "utf8")) as Suppressed[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

/** Returns true if the list persisted durably, false otherwise (read-only FS, no DB). */
async function write(list: Suppressed[]): Promise<boolean> {
  if (dbEnabled() && (await writeBlob(DB_TABLE, list))) return true;
  try {
    await fs.mkdir(path.dirname(STORE), { recursive: true });
    await fs.writeFile(STORE, JSON.stringify(list, null, 2), "utf8");
    return true;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EROFS" || code === "EACCES" || code === "EPERM") return false;
    throw err;
  }
}

export async function isSuppressed(email: string): Promise<boolean> {
  const e = norm(email);
  return (await read()).some((s) => s.email === e);
}

/** Returns true if the opt-out is now durably recorded, false if persistence failed. */
export async function addSuppression(email: string, reason = "unsubscribe"): Promise<boolean> {
  const e = norm(email);
  const list = await read();
  if (list.some((s) => s.email === e)) return true; // already suppressed
  list.push({ email: e, at: new Date().toISOString(), reason });
  const persisted = await write(list);
  if (!persisted) {
    console.warn(`[suppression] could not persist opt-out (no DB + read-only FS); reconcile manually: ${e} (${reason})`);
  }
  return persisted;
}

export async function removeSuppression(email: string): Promise<void> {
  const e = norm(email);
  await write((await read()).filter((s) => s.email !== e));
}

export async function listSuppressed(): Promise<string[]> {
  return (await read()).map((s) => s.email);
}
