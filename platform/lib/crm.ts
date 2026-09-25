/**
 * FinishLine internal CRM store.
 *
 * Unifies inbound leads (assessment / contact form) and outbound prospects
 * (from the managed-agent lead-gen engine) into a single contact list with
 * pipeline-stage tracking, re-verticaled from the RealtorCite template for an
 * AI-transformation consulting motion.
 *
 * Storage is local-first: a JSON file at `data/crm.json` (works in `next dev`).
 * On Vercel the filesystem is read-only, so the durable path is Postgres
 * (DATABASE_URL) — a single JSONB blob — falling back to JSON locally.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { dbEnabled, readBlob, writeBlob } from "./db";

const DB_TABLE = "crm_store";

export const CRM_STAGES = [
  "new",
  "contacted",
  "replied",
  "call_booked",
  "proposal",
  "won",
  "lost",
] as const;

export type CrmStage = (typeof CRM_STAGES)[number];

export const STAGE_LABELS: Record<CrmStage, string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
  call_booked: "Call booked",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

export type CrmSource = "outbound" | "inbound_assessment" | "inbound_contact";

export const SOURCE_LABELS: Record<CrmSource, string> = {
  outbound: "Outbound",
  inbound_assessment: "Inbound · Assessment",
  inbound_contact: "Inbound · Contact",
};

export type CrmActivity = {
  at: string;
  kind: "created" | "stage" | "note" | "merged" | "draft" | "fields" | "sent";
  detail: string;
};

export type ColdEmailDraft = {
  subject: string;
  body: string;
  generatedAt: string;
};

export type CrmContact = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  /** Business name. */
  company: string | null;
  /** Contact's role/title. */
  title: string | null;
  /** City / metro. */
  location: string | null;
  industry: string | null;
  website: string | null;
  source: CrmSource;
  stage: CrmStage;
  /** AI-readiness score (0–100) from the lead-gen agent; null for inbound. */
  score: number | null;
  /** AI-readiness signals the agent found (e.g. "hiring ops roles", "manual intake"). */
  signals: string[];
  /** The specific AI-transformation opportunity the agent identified. */
  aiOpportunity: string | null;
  notes: string;
  draft: ColdEmailDraft | null;
  activity: CrmActivity[];
  createdAt: string;
  updatedAt: string;
};

const STORE_PATH = path.join(process.cwd(), "data", "crm.json");

function makeId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `c_${Date.now().toString(36)}_${rand}`;
}

function now(): string {
  return new Date().toISOString();
}

/**
 * Dedupe key: email if present, else company+location+name, else name+location.
 * The no-email key includes the contact name so two different people at the same
 * company/metro stay distinct (only a true duplicate — same company, location,
 * and name — merges).
 */
function keyFor(c: Pick<CrmContact, "email" | "name" | "company" | "location">): string {
  if (c.email) return `email:${c.email.trim().toLowerCase()}`;
  const loc = (c.location ?? "").trim().toLowerCase();
  const nm = c.name.trim().toLowerCase();
  if (c.company) return `co:${c.company.trim().toLowerCase()}|${loc}|${nm}`;
  return `nm:${nm}|${loc}`;
}

async function readStore(): Promise<CrmContact[]> {
  if (dbEnabled()) {
    const rows = await readBlob<CrmContact[]>(DB_TABLE, []);
    if (rows !== null) return Array.isArray(rows) ? rows : [];
  }
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CrmContact[]) : [];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeStore(contacts: CrmContact[]): Promise<void> {
  if (dbEnabled() && (await writeBlob(DB_TABLE, contacts))) return;
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(contacts, null, 2), "utf8");
}

export async function listContacts(): Promise<CrmContact[]> {
  const contacts = await readStore();
  return contacts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getContact(id: string): Promise<CrmContact | null> {
  const contacts = await readStore();
  return contacts.find((c) => c.id === id) ?? null;
}

export type UpsertInput = {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  location?: string | null;
  industry?: string | null;
  website?: string | null;
  source: CrmSource;
  stage?: CrmStage;
  score?: number | null;
  signals?: string[];
  aiOpportunity?: string | null;
  notes?: string;
};

/**
 * Insert a new contact or merge into an existing one (matched by email, or
 * company+location). Merging fills in missing fields and never downgrades an
 * already-advanced pipeline stage.
 */
export async function upsertContact(input: UpsertInput): Promise<CrmContact> {
  const contacts = await readStore();
  const incomingKey = keyFor({
    email: input.email ?? null,
    name: input.name,
    company: input.company ?? null,
    location: input.location ?? null,
  });
  const existing = contacts.find(
    (c) =>
      keyFor(c) === incomingKey ||
      (input.email && c.email?.toLowerCase() === input.email.toLowerCase()),
  );

  if (existing) {
    existing.email = existing.email ?? input.email ?? null;
    existing.phone = existing.phone ?? input.phone ?? null;
    existing.company = existing.company ?? input.company ?? null;
    existing.title = existing.title ?? input.title ?? null;
    existing.location = existing.location ?? input.location ?? null;
    existing.industry = existing.industry ?? input.industry ?? null;
    existing.website = existing.website ?? input.website ?? null;
    existing.aiOpportunity = existing.aiOpportunity ?? input.aiOpportunity ?? null;
    if (existing.score == null && input.score != null) existing.score = input.score;
    if (input.signals?.length) {
      existing.signals = Array.from(new Set([...existing.signals, ...input.signals]));
    }
    // Accumulate incoming notes rather than dropping them — the inbound form's
    // message/scope/timeline (and the lead-gen opportunity/sources) are captured
    // in input.notes and would otherwise be lost on a dedupe merge.
    const incomingNote = input.notes?.trim();
    if (incomingNote && !existing.notes.includes(incomingNote)) {
      existing.notes = existing.notes ? `${existing.notes}\n${incomingNote}` : incomingNote;
    }
    existing.updatedAt = now();
    existing.activity.push({
      at: now(),
      kind: "merged",
      detail: incomingNote ? `Merged ${input.source}: ${incomingNote.slice(0, 80)}` : `Merged ${input.source} data`,
    });
    await writeStore(contacts);
    return existing;
  }

  const ts = now();
  const contact: CrmContact = {
    id: makeId(),
    name: input.name.trim(),
    email: input.email ?? null,
    phone: input.phone ?? null,
    company: input.company ?? null,
    title: input.title ?? null,
    location: input.location ?? null,
    industry: input.industry ?? null,
    website: input.website ?? null,
    source: input.source,
    stage: input.stage ?? "new",
    score: input.score ?? null,
    signals: input.signals ?? [],
    aiOpportunity: input.aiOpportunity ?? null,
    notes: input.notes ?? "",
    draft: null,
    activity: [{ at: ts, kind: "created", detail: `Added from ${input.source}` }],
    createdAt: ts,
    updatedAt: ts,
  };
  contacts.push(contact);
  await writeStore(contacts);
  return contact;
}

export async function setStage(id: string, stage: CrmStage): Promise<CrmContact | null> {
  if (!CRM_STAGES.includes(stage)) throw new Error(`Invalid stage: ${stage}`);
  const contacts = await readStore();
  const c = contacts.find((x) => x.id === id);
  if (!c) return null;
  const from = c.stage;
  c.stage = stage;
  c.updatedAt = now();
  c.activity.push({ at: now(), kind: "stage", detail: `${from} → ${stage}` });
  await writeStore(contacts);
  return c;
}

export async function addNote(id: string, note: string): Promise<CrmContact | null> {
  const trimmed = note.trim();
  if (!trimmed) return getContact(id);
  const contacts = await readStore();
  const c = contacts.find((x) => x.id === id);
  if (!c) return null;
  c.notes = c.notes ? `${c.notes}\n${trimmed}` : trimmed;
  c.updatedAt = now();
  c.activity.push({ at: now(), kind: "note", detail: trimmed.slice(0, 120) });
  await writeStore(contacts);
  return c;
}

export async function setFields(
  id: string,
  fields: { email?: string | null; phone?: string | null; company?: string | null; title?: string | null; website?: string | null },
): Promise<CrmContact | null> {
  const contacts = await readStore();
  const c = contacts.find((x) => x.id === id);
  if (!c) return null;
  const changed: string[] = [];
  if (fields.email !== undefined) { c.email = fields.email?.trim() || null; changed.push("email"); }
  if (fields.phone !== undefined) { c.phone = fields.phone?.trim() || null; changed.push("phone"); }
  if (fields.company !== undefined) { c.company = fields.company?.trim() || null; changed.push("company"); }
  if (fields.title !== undefined) { c.title = fields.title?.trim() || null; changed.push("title"); }
  if (fields.website !== undefined) { c.website = fields.website?.trim() || null; changed.push("website"); }
  if (changed.length === 0) return c;
  c.updatedAt = now();
  c.activity.push({ at: now(), kind: "fields", detail: `Updated ${changed.join(", ")}` });
  await writeStore(contacts);
  return c;
}

export async function setDraft(id: string, draft: ColdEmailDraft): Promise<CrmContact | null> {
  const contacts = await readStore();
  const c = contacts.find((x) => x.id === id);
  if (!c) return null;
  c.draft = draft;
  c.updatedAt = now();
  c.activity.push({ at: now(), kind: "draft", detail: `Draft: ${draft.subject}` });
  await writeStore(contacts);
  return c;
}

/** Bulk-set drafts in a single store write (keyed by contact id). */
export async function setDrafts(drafts: Record<string, ColdEmailDraft>): Promise<number> {
  const contacts = await readStore();
  let n = 0;
  for (const c of contacts) {
    const d = drafts[c.id];
    if (!d) continue;
    c.draft = d;
    c.updatedAt = now();
    c.activity.push({ at: now(), kind: "draft", detail: `Draft: ${d.subject}` });
    n += 1;
  }
  if (n > 0) await writeStore(contacts);
  return n;
}

/** Record a sent cold email: advance new→contacted (never downgrade) + log it. */
export async function markContacted(id: string, messageId?: string): Promise<CrmContact | null> {
  const contacts = await readStore();
  const c = contacts.find((x) => x.id === id);
  if (!c) return null;
  if (c.stage === "new") c.stage = "contacted";
  c.updatedAt = now();
  c.activity.push({
    at: now(),
    kind: "sent",
    detail: messageId ? `Sent cold email (id ${messageId})` : "Sent cold email",
  });
  await writeStore(contacts);
  return c;
}

/**
 * Mark several contacts contacted in a SINGLE store write. The batch send loop
 * uses this once after sending, instead of a per-contact read-modify-write of
 * the whole store, which narrows the lost-update window and is far cheaper.
 */
export async function markContactedMany(
  entries: { id: string; messageId?: string }[],
): Promise<number> {
  if (entries.length === 0) return 0;
  const byId = new Map(entries.map((e) => [e.id, e.messageId]));
  const contacts = await readStore();
  let n = 0;
  for (const c of contacts) {
    if (!byId.has(c.id)) continue;
    if (c.stage === "new") c.stage = "contacted";
    c.updatedAt = now();
    const mid = byId.get(c.id);
    c.activity.push({ at: now(), kind: "sent", detail: mid ? `Sent cold email (id ${mid})` : "Sent cold email" });
    n += 1;
  }
  if (n > 0) await writeStore(contacts);
  return n;
}

export type CrmStats = {
  total: number;
  byStage: Record<CrmStage, number>;
  bySource: Record<CrmSource, number>;
};

export function computeStats(contacts: CrmContact[]): CrmStats {
  const byStage = Object.fromEntries(CRM_STAGES.map((s) => [s, 0])) as Record<CrmStage, number>;
  const bySource: Record<CrmSource, number> = {
    outbound: 0,
    inbound_assessment: 0,
    inbound_contact: 0,
  };
  for (const c of contacts) {
    byStage[c.stage] += 1;
    bySource[c.source] += 1;
  }
  return { total: contacts.length, byStage, bySource };
}
