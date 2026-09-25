#!/usr/bin/env node
/**
 * FinishLine — Managed-Agent Lead-Gen CLI
 *
 * A Claude agent (web_search tool) sources real businesses ripe for AI
 * transformation in the requested segments, scores their AI-readiness, and
 * writes a prospects.csv the CRM imports directly (alias-tolerant columns).
 *
 * Usage:
 *   node scripts/find-leads.mjs --segments="dental practices|regional law firms" \
 *        [--location="Austin, TX"] [--count=8] [--out=./prospects.csv] [--model=claude-sonnet-4-6]
 *
 * Mirrors lib/leadgen.ts; kept self-contained so it can run from cron without
 * the Next runtime.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateText, generateObject, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { loadEnv, parseArgs, csvEscape, harvestSources } from "./_shared.mjs";

loadEnv();
const args = parseArgs(process.argv.slice(2));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("error: ANTHROPIC_API_KEY not set (in .env.local).");
  process.exit(1);
}
if (!args.segments || typeof args.segments !== "string") {
  console.error('Usage: node scripts/find-leads.mjs --segments="dental practices|law firms" [--location="Austin, TX"] [--count=8] [--out=./prospects.csv]');
  process.exit(1);
}

const segments = args.segments.split("|").map((s) => s.trim()).filter(Boolean);
const location = typeof args.location === "string" ? args.location : null;
const count = Math.max(1, Math.min(25, parseInt(args.count, 10) || 8));
const model = typeof args.model === "string" ? args.model : process.env.LEADGEN_MODEL || "claude-sonnet-4-6";
const outPath = resolve(process.cwd(), typeof args.out === "string" ? args.out : "./prospects.csv");

const LeadSchema = z.object({
  company: z.string().min(1).max(160),
  website: z.string().max(300).nullable(),
  contactName: z.string().max(120).nullable(),
  contactTitle: z.string().max(120).nullable(),
  location: z.string().max(160).nullable(),
  industry: z.string().max(120).nullable(),
  signals: z.array(z.string().max(200)),
  aiOpportunity: z.string().max(400),
  readinessScore: z.number().int().min(0).max(100),
});
const ListSchema = z.object({ leads: z.array(LeadSchema).min(0) });

const RESEARCH_SYSTEM = `You are a B2B prospecting researcher for FinishLine, an AI-transformation consultancy. Find REAL businesses in the requested segment that show concrete signs of being ripe for AI transformation (labor-heavy repetitive workflows; hiring ops/admin/support roles; dated tooling / manual forms / no AI; visible growth straining manual processes; mid-market or SMB). Only include businesses you can find on the open web — never invent companies, people, or URLs. Prefer naming the owner/CEO/founder and title. Be concrete about WHY each is ripe and WHAT AI use case would move their bottom line.`;

async function runSegment(segment) {
  const where = location ? ` in ${location}` : "";
  const target = `${segment}${where}`;
  console.log(`\n▸ ${target}`);
  process.stdout.write("  researching the web…");
  const research = await generateText({
    model: anthropic(model),
    system: RESEARCH_SYSTEM,
    prompt:
      `Find up to ${count} real businesses in this segment: ${target}. For each capture: business name, website, owner/CEO/founder name + title if visible, location, what they do, and the AI-readiness signals. Search the web to ground every business.`,
    tools: { web_search: anthropic.tools.webSearch_20260209({ maxUses: 5 }) },
    stopWhen: stepCountIs(8),
    maxOutputTokens: 4000,
  });
  const sources = harvestSources(research.steps);
  process.stdout.write(` ${sources.length} sources. structuring…`);
  if (!research.text.trim()) { console.log(" no results."); return []; }
  const { object } = await generateObject({
    model: anthropic(model),
    schema: ListSchema,
    schemaName: "LeadList",
    schemaDescription: "Structured, scored AI-transformation prospects from grounded research.",
    system: "Extract a clean, deduplicated list of prospect businesses from the research notes. Include only businesses actually named. Score readinessScore 0–100 by strength of AI-transformation fit. An empty list is fine.",
    temperature: 0.2,
    maxOutputTokens: 4000,
    prompt: `Segment: ${target}\n\nResearch notes:\n${research.text}`,
  });
  console.log(` ${object.leads.length} leads.`);
  return object.leads.map((l) => ({ ...l, segment: target }));
}

const all = [];
for (const seg of segments) {
  try {
    all.push(...(await runSegment(seg)));
  } catch (err) {
    console.error(`  error on "${seg}": ${err?.message ?? err}`);
  }
}

// Dedupe by company+location, keep highest readiness.
const byKey = new Map();
for (const l of all) {
  const key = `${(l.company || "").toLowerCase()}|${(l.location || "").toLowerCase()}`;
  const prev = byKey.get(key);
  if (!prev || l.readinessScore > prev.readinessScore) byKey.set(key, l);
}
const leads = [...byKey.values()].sort((a, b) => b.readinessScore - a.readinessScore);

const header = ["name", "company", "title", "website", "location", "industry", "score", "signals", "ai_opportunity", "segment"];
const lines = [header.join(",")];
for (const l of leads) {
  lines.push([
    csvEscape(l.contactName || l.company),
    csvEscape(l.company),
    csvEscape(l.contactTitle || ""),
    csvEscape(l.website || ""),
    csvEscape(l.location || location || ""),
    csvEscape(l.industry || ""),
    csvEscape(l.readinessScore),
    csvEscape((l.signals || []).join("|")),
    csvEscape(l.aiOpportunity || ""),
    csvEscape(l.segment || ""),
  ].join(","));
}
writeFileSync(outPath, lines.join("\n") + "\n", "utf8");

console.log("");
console.log("---");
console.log(`segments:        ${segments.length}`);
console.log(`unique leads:    ${leads.length}`);
console.log(`csv written:     ${outPath}`);
console.log("");
console.log("Top leads by AI-readiness:");
for (const l of leads.slice(0, 10)) {
  console.log(`  ${String(l.readinessScore).padStart(3)}  ${(l.company || "").slice(0, 32).padEnd(32)}  ${(l.location || "").slice(0, 18).padEnd(18)}  ${l.aiOpportunity?.slice(0, 60) ?? ""}`);
}
console.log("");
console.log("Next: import into the CRM (Import CSV in /crm, or `npm run send-emails` after drafting).");
