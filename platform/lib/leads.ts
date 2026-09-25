/**
 * Lead persistence layer.
 *
 * Best-effort multi-write (all run in parallel, never fail the caller):
 *   1. If `DATABASE_URL` is set, insert into a `leads` table.
 *   2. If `RESEND_API_KEY` is set, notify `LEAD_NOTIFY_EMAIL` (the founder).
 *   3. Always: append a JSONL line to `./data/leads.jsonl` as a durable log.
 *   4. Upsert into the CRM so inbound + outbound share one pipeline.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { upsertContact } from "./crm";
import { getSql } from "./db";

export type LeadSource = "assessment" | "contact";

export type LeadInput = {
  source: LeadSource;
  email: string;
  name?: string | null;
  phone?: string | null;
  company?: string | null;
  title?: string | null;
  industry?: string | null;
  location?: string | null;
  website?: string | null;
  /** Free-text: what they want help with / their AI question. */
  message?: string | null;
  /** Scope/timeline selectors from the form, if present. */
  scope?: string | null;
  timeline?: string | null;
};

export type LeadRecord = LeadInput & {
  id: string;
  createdAt: string;
};

function makeId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `lead_${Date.now().toString(36)}_${rand}`;
}

let fsArchiveDisabled = false;
function isReadOnlyFsError(err: unknown): boolean {
  const code = (err as { code?: string } | null)?.code;
  return code === "EROFS" || code === "EACCES" || code === "EPERM";
}

async function appendJsonl(record: LeadRecord) {
  if (fsArchiveDisabled) return;
  try {
    const dir = path.join(process.cwd(), "data");
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(path.join(dir, "leads.jsonl"), JSON.stringify(record) + "\n", "utf8");
  } catch (err) {
    if (isReadOnlyFsError(err)) {
      fsArchiveDisabled = true;
      console.info("[leads] read-only filesystem — skipping local JSONL archive (expected on Vercel)");
      return;
    }
    console.error("[leads] JSONL write failed:", err);
  }
}

const DEFAULT_FROM = "FinishLine <onboarding@finishlinemsp.com>";

export async function sendResend(args: {
  from?: string;
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: args.from ?? process.env.LEAD_FROM_EMAIL ?? DEFAULT_FROM,
        to: [args.to],
        reply_to: args.replyTo,
        subject: args.subject,
        text: args.text,
        html: args.html,
      }),
    });
    if (!res.ok) console.error("[leads] Resend non-OK:", res.status, await res.text(), "→", args.to);
  } catch (err) {
    console.error("[leads] Resend error:", err, "→", args.to);
  }
}

async function notifyFounder(record: LeadRecord) {
  const to = process.env.LEAD_NOTIFY_EMAIL;
  if (!to) return;
  const subject = `[FinishLine] New ${record.source} lead — ${record.email}`;
  const lines = [
    `Source: ${record.source}`,
    `Email: ${record.email}`,
    record.name ? `Name: ${record.name}` : null,
    record.title ? `Role: ${record.title}` : null,
    record.company ? `Company: ${record.company}` : null,
    record.industry ? `Industry: ${record.industry}` : null,
    record.location ? `Location: ${record.location}` : null,
    record.website ? `Website: ${record.website}` : null,
    record.phone ? `Phone: ${record.phone}` : null,
    record.scope ? `Scope: ${record.scope}` : null,
    record.timeline ? `Timeline: ${record.timeline}` : null,
    record.message ? `\nMessage:\n${record.message}` : null,
    `\nID: ${record.id}`,
    `Created: ${record.createdAt}`,
  ].filter(Boolean) as string[];
  await sendResend({ to, replyTo: record.email, subject, text: lines.join("\n") });
}

async function insertIntoPostgres(record: LeadRecord) {
  const sql = getSql();
  if (!sql) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS leads (
        id          text primary key,
        source      text not null,
        email       text not null,
        name        text,
        phone       text,
        company     text,
        title       text,
        industry    text,
        location    text,
        website     text,
        scope       text,
        timeline    text,
        message     text,
        created_at  timestamptz not null default now()
      )
    `;
    await sql`
      INSERT INTO leads (id, source, email, name, phone, company, title, industry, location, website, scope, timeline, message, created_at)
      VALUES (
        ${record.id}, ${record.source}, ${record.email}, ${record.name ?? null},
        ${record.phone ?? null}, ${record.company ?? null}, ${record.title ?? null},
        ${record.industry ?? null}, ${record.location ?? null}, ${record.website ?? null},
        ${record.scope ?? null}, ${record.timeline ?? null}, ${record.message ?? null},
        ${record.createdAt}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  } catch (err) {
    console.error("[leads] Postgres insert failed:", err);
  }
}

async function syncToCrm(record: LeadRecord) {
  const noteParts = [
    record.scope ? `Scope: ${record.scope}` : null,
    record.timeline ? `Timeline: ${record.timeline}` : null,
    record.message ? `Message: ${record.message}` : null,
  ].filter(Boolean);
  try {
    await upsertContact({
      name: record.name?.trim() || record.email.split("@")[0],
      email: record.email,
      phone: record.phone ?? null,
      company: record.company ?? null,
      title: record.title ?? null,
      industry: record.industry ?? null,
      location: record.location ?? null,
      website: record.website ?? null,
      source: record.source === "assessment" ? "inbound_assessment" : "inbound_contact",
      notes: noteParts.join(" · "),
    });
  } catch (err) {
    console.error("[leads] CRM sync failed:", err);
  }
}

export type PersistOptions = { notify?: boolean };

export async function persistLead(input: LeadInput, opts: PersistOptions = {}): Promise<LeadRecord> {
  const { notify = true } = opts;
  const record: LeadRecord = { ...input, id: makeId(), createdAt: new Date().toISOString() };
  await Promise.allSettled([
    appendJsonl(record),
    notify ? notifyFounder(record) : Promise.resolve(),
    insertIntoPostgres(record),
    syncToCrm(record),
  ]);
  return record;
}
