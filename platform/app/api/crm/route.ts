import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  listContacts,
  getContact,
  computeStats,
  setStage,
  setFields,
  setDraft,
  setDrafts,
  addNote,
  markContactedMany,
  upsertContact,
  CRM_STAGES,
  type CrmContact,
  type CrmStage,
  type ColdEmailDraft,
} from "@/lib/crm";
import { generateColdEmail, buildSendList, sendColdEmail } from "@/lib/outreach";
import { isSuppressed } from "@/lib/suppression";
import { crmAuthError } from "@/lib/crm-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: Request) {
  const denied = crmAuthError(request);
  if (denied) return denied;
  const contacts = await listContacts();
  return Response.json({ contacts, stats: computeStats(contacts), stages: CRM_STAGES });
}

const PatchSchema = z.object({
  id: z.string().min(1),
  stage: z.enum(CRM_STAGES).optional(),
  note: z.string().max(2000).optional(),
  email: z.string().trim().email().max(200).or(z.literal("")).optional(),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  title: z.string().trim().max(120).optional(),
  website: z.string().trim().max(300).optional(),
});

export async function PATCH(request: Request) {
  const denied = crmAuthError(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { id, stage, note, email, phone, company, title, website } = parsed.data;
  try {
    let contact = await getContact(id);
    if (!contact) return Response.json({ error: "Contact not found" }, { status: 404 });
    if (
      email !== undefined || phone !== undefined || company !== undefined ||
      title !== undefined || website !== undefined
    ) {
      contact = await setFields(id, { email, phone, company, title, website });
    }
    if (stage) contact = await setStage(id, stage as CrmStage);
    if (note) contact = await addNote(id, note);
    return Response.json({ ok: true, contact });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

const PostSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("import_prospects"), csv: z.string().optional() }),
  z.object({ action: z.literal("draft"), id: z.string().min(1) }),
  z.object({
    action: z.literal("draft_all"),
    stage: z.enum(CRM_STAGES).optional(),
    limit: z.number().int().min(1).max(200).optional(),
    regenerate: z.boolean().optional(),
  }),
  z.object({ action: z.literal("export_send_list"), stage: z.enum(CRM_STAGES).optional() }),
  z.object({
    action: z.literal("add_contact"),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email().max(200).optional(),
    company: z.string().trim().max(160).optional(),
    title: z.string().trim().max(120).optional(),
    location: z.string().trim().max(160).optional(),
    industry: z.string().trim().max(120).optional(),
    website: z.string().trim().max(300).optional(),
    source: z.enum(["outbound", "inbound_assessment", "inbound_contact"]).optional(),
  }),
  z.object({
    action: z.literal("send"),
    id: z.string().optional(),
    ids: z.array(z.string()).optional(),
    stage: z.enum(CRM_STAGES).optional(),
    limit: z.number().int().min(1).max(200).optional(),
    dryRun: z.boolean().optional(),
  }),
]);

export async function POST(request: Request) {
  const denied = crmAuthError(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  // --- Manually add a single contact ------------------------------------
  if (parsed.data.action === "add_contact") {
    const { name, email, company, title, location, industry, website, source } = parsed.data;
    try {
      const contact = await upsertContact({
        name,
        email: email ?? null,
        company: company ?? null,
        title: title ?? null,
        location: location ?? null,
        industry: industry ?? null,
        website: website ?? null,
        source: source ?? "outbound",
      });
      return Response.json({ ok: true, contact });
    } catch (err) {
      return Response.json({ error: err instanceof Error ? err.message : "Add failed" }, { status: 500 });
    }
  }

  // --- Send drafted cold emails (dry-run by default) ---------------------
  if (parsed.data.action === "send") {
    const { id, ids, stage, limit } = parsed.data;
    const dryRun = parsed.data.dryRun !== false; // default true — never send unless explicit
    const all = await listContacts();

    let pool: CrmContact[];
    if (id) pool = all.filter((c) => c.id === id);
    else if (ids?.length) pool = all.filter((c) => ids.includes(c.id));
    else pool = all.filter((c) => c.stage === (stage ?? "new"));

    const withDraft = pool.filter((c) => c.email && c.draft).slice(0, limit ?? 200);
    const sendable: CrmContact[] = [];
    let suppressedCount = 0;
    for (const c of withDraft) {
      if (await isSuppressed(c.email!)) suppressedCount += 1;
      else sendable.push(c);
    }

    if (sendable.length === 0) {
      return Response.json(
        {
          error:
            suppressedCount > 0
              ? `No sendable contacts — ${suppressedCount} matched but have unsubscribed.`
              : "No sendable contacts (need both an email and a generated draft).",
          suppressed: suppressedCount,
        },
        { status: 400 },
      );
    }

    if (dryRun) {
      return Response.json({
        ok: true,
        dryRun: true,
        count: sendable.length,
        suppressed: suppressedCount,
        preview: sendable.map((c) => ({ id: c.id, name: c.name, email: c.email, subject: c.draft!.subject })),
      });
    }

    const results: { id: string; email: string | null; ok: boolean; messageId?: string; error?: string }[] = [];
    const contacted: { id: string; messageId?: string }[] = [];
    for (const c of sendable) {
      const r = await sendColdEmail(c);
      if (r.ok) {
        contacted.push({ id: c.id, messageId: r.id });
        await appendSentLog({ at: new Date().toISOString(), id: c.id, email: c.email, subject: c.draft!.subject, messageId: r.id ?? null, ok: true });
      } else {
        await appendSentLog({ at: new Date().toISOString(), id: c.id, email: c.email, subject: c.draft!.subject, messageId: null, ok: false, error: r.error });
      }
      results.push({ id: c.id, email: c.email, ok: r.ok, messageId: r.id, error: r.error });
      if (sendable.length > 1) await new Promise((res) => setTimeout(res, 1200));
    }
    // Single store write for all successful sends (narrows the lost-update window).
    await markContactedMany(contacted);
    const sent = results.filter((r) => r.ok).length;
    return Response.json({ ok: true, dryRun: false, sent, failed: results.length - sent, suppressed: suppressedCount, results });
  }

  // --- Generate a personalized cold-email draft for one contact ----------
  if (parsed.data.action === "draft") {
    const contact = await getContact(parsed.data.id);
    if (!contact) return Response.json({ error: "Contact not found" }, { status: 404 });
    try {
      const draft = await generateColdEmail(contact);
      const updated = await setDraft(contact.id, draft);
      return Response.json({ ok: true, contact: updated });
    } catch (err) {
      return Response.json({ error: err instanceof Error ? err.message : "Draft failed" }, { status: 500 });
    }
  }

  // --- Bulk-generate drafts for every candidate in one pass --------------
  if (parsed.data.action === "draft_all") {
    const { stage, limit, regenerate } = parsed.data;
    const all = await listContacts();
    const candidates = all
      .filter((c) => c.stage === (stage ?? "new") && c.email)
      .filter((c) => (regenerate ? true : !c.draft))
      .slice(0, limit ?? 100);

    if (candidates.length === 0) {
      return Response.json({
        ok: true,
        drafted: 0,
        candidates: 0,
        message: "No candidates — need a contact in this stage with an email (already-drafted are skipped unless regenerate).",
      });
    }

    const drafts: Record<string, ColdEmailDraft> = {};
    const errors: { id: string; error: string }[] = [];
    let cursor = 0;
    const worker = async () => {
      while (cursor < candidates.length) {
        const c = candidates[cursor++];
        try {
          drafts[c.id] = await generateColdEmail(c, { genericGreeting: true });
        } catch (err) {
          errors.push({ id: c.id, error: err instanceof Error ? err.message : "draft failed" });
        }
      }
    };
    const CONCURRENCY = 4;
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, candidates.length) }, worker));

    const drafted = await setDrafts(drafts);
    return Response.json({ ok: true, drafted, candidates: candidates.length, failed: errors.length, ...(errors.length ? { errors } : {}) });
  }

  // --- Export sendable contacts to send-list.md --------------------------
  if (parsed.data.action === "export_send_list") {
    const stageFilter = parsed.data.stage;
    const all = await listContacts();
    const pool = stageFilter ? all.filter((c) => c.stage === stageFilter) : all;
    const { text, count, skipped } = buildSendList(pool);
    if (count === 0) {
      return Response.json({ error: "No sendable contacts (need both an email and a generated draft).", skipped }, { status: 400 });
    }
    try {
      await fs.writeFile(path.join(process.cwd(), "send-list.md"), text, "utf8");
      return Response.json({ ok: true, count, skipped, path: "send-list.md" });
    } catch (err) {
      return Response.json({ error: err instanceof Error ? err.message : "Write failed" }, { status: 500 });
    }
  }

  // --- Import prospects.csv ----------------------------------------------
  let csvText = parsed.data.csv;
  if (!csvText) {
    try {
      csvText = await fs.readFile(path.join(process.cwd(), "prospects.csv"), "utf8");
    } catch {
      return Response.json({ error: "No prospects.csv found. Run `npm run leads` first, or paste CSV." }, { status: 404 });
    }
  }

  const rows = parseCsv(csvText);
  let imported = 0;
  let skipped = 0;
  for (const row of rows) {
    const name =
      rowGet(row, "name", "personName", "fullName", "full name", "contact", "contactName", "owner") ||
      [rowGet(row, "firstName", "first name", "first"), rowGet(row, "lastName", "last name", "last")].filter(Boolean).join(" ") ||
      rowGet(row, "company", "businessName", "business name", "organization");
    const email = rowGet(row, "email", "emailAddress", "email address", "workEmail", "work email") || null;
    const company = rowGet(row, "company", "businessName", "business name", "organization") || null;
    const finalName = name || company || (email ? email.split("@")[0] : "");
    if (!finalName) {
      skipped += 1;
      continue;
    }
    const cityState = [rowGet(row, "city"), rowGet(row, "state")].filter(Boolean).join(", ");
    const scoreStr = rowGet(row, "score", "readiness", "readinessScore", "readiness_score");
    const score = scoreStr ? Number(scoreStr) : NaN;
    try {
      await upsertContact({
        name: finalName,
        email,
        phone: rowGet(row, "phone", "phoneNumber", "phone number", "mobile", "cell") || null,
        company,
        title: rowGet(row, "title", "role", "contactTitle", "contact title") || null,
        location: rowGet(row, "location", "metro", "market") || cityState || null,
        industry: rowGet(row, "industry", "sector", "vertical") || null,
        website: rowGet(row, "website", "url", "site", "domain") || null,
        source: "outbound",
        score: Number.isFinite(score) ? score : null,
        signals: rowGet(row, "signals")
          ? rowGet(row, "signals").split(/[|;]/).map((s) => s.trim()).filter(Boolean)
          : [],
        aiOpportunity: rowGet(row, "ai_opportunity", "aiOpportunity", "opportunity") || null,
      });
      imported += 1;
    } catch (err) {
      return Response.json({ error: err instanceof Error ? err.message : "import failed", imported }, { status: 500 });
    }
  }
  return Response.json({ ok: true, imported, rows: rows.length, skipped });
}

async function appendSentLog(entry: Record<string, unknown>): Promise<void> {
  try {
    const dir = path.join(process.cwd(), "data");
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(path.join(dir, "sent-log.jsonl"), JSON.stringify(entry) + "\n", "utf8");
  } catch (err) {
    console.error("[crm] sent-log write failed:", err);
  }
}

/** Case/space/underscore-insensitive column lookup with aliases. */
function rowGet(row: Record<string, string>, ...keys: string[]): string {
  const norm = (k: string) => k.toLowerCase().replace(/[\s_]+/g, "");
  const lut: Record<string, string> = {};
  for (const k of Object.keys(row)) lut[norm(k)] = row[k];
  for (const key of keys) {
    const v = lut[norm(key)];
    if (v && v.trim()) return v.trim();
  }
  return "";
}

/** Minimal RFC-4180-ish CSV parser: quoted fields, escaped quotes, embedded commas/newlines. */
function parseCsv(text: string): Record<string, string>[] {
  const records: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((c) => c !== "")) records.push(row);
      row = [];
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((c) => c !== "")) records.push(row);
  }
  if (records.length === 0) return [];
  const header = records[0].map((h) => h.trim());
  return records.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    header.forEach((h, idx) => { obj[h] = r[idx] ?? ""; });
    return obj;
  });
}
