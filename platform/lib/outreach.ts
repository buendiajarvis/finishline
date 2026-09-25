/**
 * Outbound cold-email drafting + send-list export + Resend send.
 *
 * `generateColdEmail` writes a short, personalized cold email for a CRM contact
 * using the AI-readiness signal the lead-gen agent already captured (industry,
 * the identified AI opportunity, the readiness signals). Uses Claude when
 * ANTHROPIC_API_KEY is present and falls back to a deterministic template
 * otherwise, so the CRM stays usable without provider credentials.
 *
 * Send safety is non-negotiable and carried over verbatim from the template:
 * the send path refuses suppressed addresses, attaches a CAN-SPAM footer
 * (physical postal address + HMAC unsubscribe + List-Unsubscribe headers), and
 * is only ever invoked behind a dry-run-by-default API.
 */
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { ColdEmailDraft, CrmContact } from "./crm";
import { unsubscribeUrl, isSuppressed } from "./suppression";
import { hasAnthropic, draftModelId } from "./ai";
import { fetchCompanyContext, companyContextBlock } from "./company-context";
import { SITE } from "./site";

const POSTAL_ADDRESS = SITE.postalAddress;

const DraftSchema = z.object({
  subject: z.string().min(3).max(90),
  body: z.string().min(20).max(1800),
});

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** Force a casual "Hi there," opening for bulk drafts where the contact "name"
 *  is an unreliable import artifact (often a business name). */
function withGenericGreeting(body: string): string {
  const trimmed = body.replace(/^\s+/, "");
  if (/^(hi|hello|hey|dear)\b[^\n]*/i.test(trimmed)) {
    return trimmed.replace(/^(hi|hello|hey|dear)\b[^\n]*/i, "Hi there,");
  }
  return `Hi there,\n\n${trimmed}`;
}

/** Deterministic fallback used when no LLM is available or generation fails. */
function templateDraft(contact: CrmContact, genericGreeting = false): ColdEmailDraft {
  const fn = firstName(contact.name);
  const co = contact.company ?? "your business";
  const industry = contact.industry ? ` in ${contact.industry}` : "";
  const opp =
    contact.aiOpportunity ||
    "the repetitive, manual work that quietly eats your team's hours every week";
  const subject = genericGreeting
    ? `The AI opportunity hiding in ${co}`
    : `${fn} — the AI opportunity hiding in ${co}`;
  const body = [
    genericGreeting ? `Hi there,` : `Hi ${fn},`,
    ``,
    `Most ${contact.industry || "business"} owners${industry} are reading the same AI headlines and wondering whether to act, wait, or ignore them. The ones who move first aren't buying hype — they're putting one concrete use case into production while competitors are still in meetings.`,
    ``,
    `For ${co}, the highest-leverage starting point looks like ${opp}. FinishLine scopes the highest-ROI use case, builds it, and ships it — in weeks, not quarters. No strategy deck. Production.`,
    ``,
    `Worth a 60-minute AI opportunity review? No pitch — you leave with a ranked list of where AI actually moves your bottom line, whether or not we work together.`,
    ``,
    `— Phil, FinishLine`,
  ].join("\n");
  return { subject, body, generatedAt: new Date().toISOString() };
}

export async function generateColdEmail(
  contact: CrmContact,
  opts: { genericGreeting?: boolean } = {},
): Promise<ColdEmailDraft> {
  const { genericGreeting = false } = opts;
  if (!hasAnthropic()) return templateDraft(contact, genericGreeting);

  // Pull live context from the prospect's website (domain from their email, or
  // an explicit website). Best-effort: null when unavailable or a free-mail
  // domain — the draft still generates from the CRM fields alone.
  const site = await fetchCompanyContext({ email: contact.email, website: contact.website });
  const siteBlock = companyContextBlock(site);

  const signal = [
    genericGreeting ? null : `Contact name: ${contact.name}`,
    contact.title ? `Role: ${contact.title}` : null,
    contact.company ? `Company: ${contact.company}` : null,
    contact.industry ? `Industry: ${contact.industry}` : null,
    contact.location ? `Location: ${contact.location}` : null,
    contact.aiOpportunity ? `Identified AI opportunity: ${contact.aiOpportunity}` : null,
    contact.signals.length ? `AI-readiness signals observed: ${contact.signals.join("; ")}` : null,
    contact.score != null ? `AI-readiness score: ${contact.score}/100` : null,
    siteBlock || null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { object } = await generateObject({
      model: anthropic(draftModelId()),
      schema: DraftSchema,
      schemaName: "ColdEmail",
      schemaDescription: "A short personalized B2B cold email: subject + plain-text body.",
      temperature: 0.6,
      maxOutputTokens: 700,
      system:
        "You write concise, credible B2B cold emails for FinishLine, an AI-transformation consultancy that helps CEOs and business owners turn AI adoption into measurable bottom-line results — vendor-agnostic strategy plus production engineering, scoped in weeks not quarters. " +
        "Voice: direct, specific, anti-hype, execution-over-theater. No exclamation points, no fake familiarity, no buzzword salad. 120 words max in the body. " +
        "Frame the OPPORTUNITY around the recipient's own P&L: a concrete, plausible use case for their business, the competitive cost of waiting, and the fact that first movers ship one use case while rivals are still in meetings. " +
        (siteBlock
          ? "A 'Company website' block is included below: ground the email in what THIS company actually does, referencing a specific detail from their site so it reads researched — but use ONLY facts present in that text; never invent specifics. "
          : "Make NO unverifiable claims about their specific operations — speak to what is typical for their industry. ") +
        "Close with a soft CTA to a free 60-minute AI opportunity review (they leave with a ranked list of where AI moves their bottom line, no obligation). Sign off as '— Phil, FinishLine'. Subject under 60 characters, lowercase-ish, no spammy words." +
        (genericGreeting
          ? " Open the body with exactly 'Hi there,' — you do NOT have a reliable first name, so never address them by name anywhere (not greeting, not subject)."
          : ""),
      prompt: `Write a cold email to this prospect:\n\n${signal}`,
    });
    const body = genericGreeting ? withGenericGreeting(object.body) : object.body;
    return { ...object, body, generatedAt: new Date().toISOString() };
  } catch {
    return templateDraft(contact, genericGreeting);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function textFooter(email: string): string {
  return (
    "\n\n—\nFinishLine · AI transformation, in production · https://www.finishlinemsp.com\n" +
    `${POSTAL_ADDRESS}\n` +
    `Unsubscribe: ${unsubscribeUrl(email)}`
  );
}

function bodyToHtml(body: string): string {
  return body
    .trim()
    .split(/\n{2,}/)
    .map((para) => `<p style="margin:0 0 14px;">${escapeHtml(para).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function htmlEmail(body: string, unsubUrl: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#ffffff;">
<div style="max-width:560px;margin:0 auto;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;">
${bodyToHtml(body)}
<hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0 16px;" />
<div style="font-size:12px;line-height:1.7;color:#94a3b8;">
  <div style="margin-bottom:10px;">
    <a href="${unsubUrl}" style="display:inline-block;padding:8px 16px;background:#f1f5f9;color:#475569;text-decoration:none;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;font-weight:500;">Unsubscribe</a>
  </div>
  FinishLine · AI transformation, in production · <a href="https://www.finishlinemsp.com" style="color:#94a3b8;">finishlinemsp.com</a><br>
  ${escapeHtml(POSTAL_ADDRESS)}
</div>
</div></body></html>`;
}

export type SendResult = { ok: boolean; id?: string; error?: string; suppressed?: boolean };

/**
 * Send a contact's drafted cold email via Resend, with a CAN-SPAM-compliant
 * footer and a List-Unsubscribe header. Refuses suppressed addresses. The
 * caller marks the contact contacted on success.
 */
export async function sendColdEmail(contact: CrmContact): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };
  if (!contact.email) return { ok: false, error: "Contact has no email" };
  if (!contact.draft) return { ok: false, error: "Contact has no draft" };
  if (await isSuppressed(contact.email)) {
    return { ok: false, suppressed: true, error: "Recipient unsubscribed" };
  }

  const from = process.env.LEAD_FROM_EMAIL ?? "FinishLine <onboarding@finishlinemsp.com>";
  const replyTo = process.env.LEAD_REPLY_TO ?? process.env.LEAD_NOTIFY_EMAIL;
  const unsubUrl = unsubscribeUrl(contact.email);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [contact.email],
        reply_to: replyTo,
        subject: contact.draft.subject,
        text: contact.draft.body.trim() + textFooter(contact.email),
        html: htmlEmail(contact.draft.body, unsubUrl),
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `Resend ${res.status}: ${(await res.text()).slice(0, 200)}` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send threw" };
  }
}

/** Serialize sendable contacts (email + draft) into send-list.md block format. */
export function buildSendList(contacts: CrmContact[]): { text: string; count: number; skipped: number } {
  const blocks: string[] = [];
  let skipped = 0;
  for (const c of contacts) {
    if (!c.email || !c.draft) {
      skipped += 1;
      continue;
    }
    blocks.push(
      [
        "--- prospect ---",
        `to: ${c.email}`,
        `name: ${c.name}`,
        `subject: ${c.draft.subject}`,
        "---",
        c.draft.body.trim() + textFooter(c.email),
      ].join("\n"),
    );
  }
  const header = [
    `<!-- Generated by FinishLine CRM on ${new Date().toISOString()} -->`,
    `<!-- ${blocks.length} sendable contact(s). Review, then: npm run send-emails (dry-run by default; add --send) -->`,
    "",
  ].join("\n");
  return { text: header + blocks.join("\n\n") + "\n", count: blocks.length, skipped };
}
