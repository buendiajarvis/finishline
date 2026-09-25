/**
 * MSP support-ticket capture.
 *
 * Routes a submitted ticket (name, email, phone, problem) to the FinishLine
 * inbox — phil@finishlinemsp.com by default — via Resend, with the submitter
 * set as reply-to so support can reply directly. Best-effort appends a JSONL
 * record for a local log. Returns whether the ticket was actually routed so the
 * API can avoid promising a 15-minute callback it couldn't deliver.
 */
import { promises as fs } from "node:fs";
import path from "node:path";

export type TicketInput = { name: string; email: string; phone: string; problem: string };
export type TicketRecord = TicketInput & { id: string; createdAt: string };

function makeId(): string {
  return `tkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Routing target — defaults exactly to phil@finishlinemsp.com, env-overridable. */
const TICKET_TO = process.env.TICKET_NOTIFY_EMAIL || process.env.LEAD_NOTIFY_EMAIL || "phil@finishlinemsp.com";
const TICKET_FROM = process.env.LEAD_FROM_EMAIL || "FinishLine Support <support@finishlinemsp.com>";

let fsDisabled = false;
async function appendJsonl(record: TicketRecord) {
  if (fsDisabled) return;
  try {
    const dir = path.join(process.cwd(), "data");
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(path.join(dir, "tickets.jsonl"), JSON.stringify(record) + "\n", "utf8");
  } catch (err) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
      fsDisabled = true; // read-only FS (Vercel) — expected; the email is the durable record.
      return;
    }
    console.error("[ticket] JSONL write failed:", err);
  }
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Single-line, header-safe version of a field for the subject line. */
function oneLine(s: string): string {
  return s.replace(/[\r\n]+/g, " ").trim();
}

async function sendTicketEmail(r: TicketRecord): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };
  const text = [
    "New MSP support ticket",
    "",
    `Name:     ${r.name}`,
    `Email:    ${r.email}`,
    `Phone:    ${r.phone}`,
    "",
    "Problem:",
    r.problem,
    "",
    `Ticket:   ${r.id}`,
    `Received: ${r.createdAt}`,
    "SLA: respond within 15 minutes.",
  ].join("\n");
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:560px">
  <h2 style="font-size:18px;margin:0 0 12px">New MSP support ticket</h2>
  <table style="font-size:14px;border-collapse:collapse">
    <tr><td style="padding:2px 12px 2px 0;color:#64748b">Name</td><td><strong>${esc(r.name)}</strong></td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#64748b">Email</td><td><a href="mailto:${esc(r.email)}">${esc(r.email)}</a></td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#64748b">Phone</td><td><a href="tel:${esc(r.phone)}">${esc(r.phone)}</a></td></tr>
  </table>
  <p style="margin:14px 0 4px;color:#64748b;font-size:13px">Problem</p>
  <div style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px">${esc(r.problem)}</div>
  <p style="margin:14px 0 0;font-size:12px;color:#94a3b8">Ticket ${esc(r.id)} · ${esc(r.createdAt)} · SLA: respond within 15 minutes</p>
</div>`;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: TICKET_FROM,
        to: [TICKET_TO],
        reply_to: r.email,
        subject: `[FinishLine MSP] New ticket — ${oneLine(r.name)}`,
        text,
        html,
      }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send threw" };
  }
}

export async function persistTicket(input: TicketInput): Promise<{ ok: boolean; id: string; emailed: boolean; error?: string }> {
  const record: TicketRecord = { ...input, id: makeId(), createdAt: new Date().toISOString() };
  await appendJsonl(record);
  if (!process.env.RESEND_API_KEY) {
    // No email channel → the ticket isn't actually routed. Fail hard so the API
    // returns 502 and the visitor sees the truthful "email/call us" fallback
    // instead of a false "we'll contact you in 15 minutes" promise.
    console.error("[ticket] RESEND_API_KEY not set — cannot route ticket:", record.id);
    return { ok: false, id: record.id, emailed: false, error: "RESEND_API_KEY not set" };
  }
  const sent = await sendTicketEmail(record);
  if (!sent.ok) return { ok: false, id: record.id, emailed: false, error: sent.error };
  return { ok: true, id: record.id, emailed: true };
}
