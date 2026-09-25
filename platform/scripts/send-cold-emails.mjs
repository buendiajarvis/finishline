#!/usr/bin/env node
/**
 * FinishLine — Cold-email sender (dry-run by default).
 *
 * Reads send-list.md (exported from the CRM), and previews every email. Nothing
 * is sent unless you pass --send. Honors the suppression list and logs every
 * attempt to data/sent-log.jsonl. Spaces sends ~1.2s apart.
 *
 * Usage:
 *   node scripts/send-cold-emails.mjs              # dry-run preview
 *   node scripts/send-cold-emails.mjs --send       # actually send
 *   node scripts/send-cold-emails.mjs --file=send-list.md --limit=25 --send
 */
import { readFileSync, existsSync, appendFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import crypto from "node:crypto";
import { appRoot, loadEnv, parseArgs } from "./_shared.mjs";

loadEnv();
const args = parseArgs(process.argv.slice(2));
const doSend = Boolean(args.send);
const file = resolve(process.cwd(), typeof args.file === "string" ? args.file : "send-list.md");
const limit = parseInt(args.limit, 10) || Infinity;

if (!existsSync(file)) {
  console.error(`error: ${file} not found. Export it from the CRM first (Export send list).`);
  process.exit(1);
}

function parseList(text) {
  const blocks = text.split(/^---\s*prospect\s*---\s*$/im).map((b) => b.trim()).filter(Boolean);
  const out = [];
  for (const block of blocks) {
    const sep = block.indexOf("\n---");
    if (sep < 0) continue;
    const head = block.slice(0, sep);
    const body = block.slice(sep + 4).replace(/^\s*\n/, "");
    const to = head.match(/^to:\s*(.+)$/im)?.[1]?.trim();
    const name = head.match(/^name:\s*(.+)$/im)?.[1]?.trim() ?? "";
    const subject = head.match(/^subject:\s*(.+)$/im)?.[1]?.trim();
    if (to && subject) out.push({ to, name, subject, body: body.trim() });
  }
  return out;
}

// Reconstruct the HMAC unsubscribe URL (mirrors lib/suppression.ts) so the CLI
// attaches the same List-Unsubscribe headers the API send path uses.
function unsubUrl(email) {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRM_TOKEN || "finishline-unsubscribe-dev-only";
  const token = crypto.createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.finishlinemsp.com";
  const u = new URL("/api/unsubscribe", base);
  u.searchParams.set("email", email);
  u.searchParams.set("token", token);
  return u.toString();
}

// Suppression: durable Postgres blob when DATABASE_URL is set (honors opt-outs
// captured on the deployed instance), else the local JSON store.
const suppPath = join(appRoot, "data", "unsubscribed.json");
async function loadSuppressed() {
  if (process.env.DATABASE_URL) {
    try {
      const { default: postgres } = await import("postgres");
      const sql = postgres(process.env.DATABASE_URL, { max: 1, idle_timeout: 5 });
      const rows = await sql`select data from suppression_store where id = 1`;
      await sql.end();
      const list = rows[0]?.data ?? [];
      return new Set(list.map((s) => (s.email || s).toLowerCase()));
    } catch (err) {
      console.warn("  warn: could not read suppression from Postgres:", err?.message ?? err);
    }
  }
  if (existsSync(suppPath)) {
    try {
      return new Set(JSON.parse(readFileSync(suppPath, "utf8")).map((s) => (s.email || s).toLowerCase()));
    } catch {}
  }
  return new Set();
}
const suppressed = await loadSuppressed();

const all = parseList(readFileSync(file, "utf8"));
const queue = all.filter((p) => !suppressed.has(p.to.toLowerCase())).slice(0, limit);
const skipped = all.length - queue.length;

console.log("");
console.log("FinishLine cold-email sender");
console.log("============================");
console.log(`  file:        ${file}`);
console.log(`  parsed:      ${all.length}`);
console.log(`  suppressed:  ${skipped}`);
console.log(`  to send:     ${queue.length}`);
console.log(`  mode:        ${doSend ? "SEND (live)" : "DRY-RUN (preview only)"}`);
console.log("");

if (!doSend) {
  for (const p of queue) console.log(`  • ${p.to.padEnd(34)} ${p.subject}`);
  console.log("\nDry-run only. Re-run with --send to actually send.");
  process.exit(0);
}

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("error: RESEND_API_KEY not set — cannot send.");
  process.exit(1);
}
const from = process.env.LEAD_FROM_EMAIL ?? "FinishLine <onboarding@finishlinemsp.com>";
const replyTo = process.env.LEAD_REPLY_TO ?? process.env.LEAD_NOTIFY_EMAIL;

mkdirSync(join(appRoot, "data"), { recursive: true });
const logPath = join(appRoot, "data", "sent-log.jsonl");

let sent = 0, failed = 0;
for (const p of queue) {
  let ok = false, id = null, error = null;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [p.to],
        reply_to: replyTo,
        subject: p.subject,
        text: p.body,
        headers: {
          "List-Unsubscribe": `<${unsubUrl(p.to)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    if (res.ok) { ok = true; id = (await res.json().catch(() => ({}))).id ?? null; }
    else error = `Resend ${res.status}: ${(await res.text()).slice(0, 160)}`;
  } catch (err) {
    error = err?.message ?? "send threw";
  }
  if (ok) sent++; else failed++;
  console.log(`  ${ok ? "✓" : "✗"} ${p.to.padEnd(34)} ${ok ? `id ${id}` : error}`);
  appendFileSync(logPath, JSON.stringify({ at: new Date().toISOString(), to: p.to, subject: p.subject, ok, id, error }) + "\n");
  if (queue.length > 1) await new Promise((r) => setTimeout(r, 1200));
}

console.log(`\nDone. Sent ${sent}, failed ${failed}. Log: data/sent-log.jsonl`);
