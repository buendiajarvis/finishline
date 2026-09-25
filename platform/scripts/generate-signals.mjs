#!/usr/bin/env node
/**
 * FinishLine — Daily Content Engine
 *
 * Produces a dated "AI Signals" briefing for CEOs & business owners: curates
 * ~6 AI-adoption news items and, for each, writes the bottom-line implication
 * ("why this moves your P&L"). Output is content/signals/<date>.json, which the
 * Next app renders at /signals/<date>.
 *
 * Usage:
 *   node scripts/generate-signals.mjs [--date=YYYY-MM-DD] [--count=6]
 *                                     [--input=path/to/items.json] [--model=claude-sonnet-4-6]
 *
 * --input is an optional JSON array of raw items: [{ title, url?, source?, tag?, excerpt? }].
 * Without it, the agent uses web search to surface the week's most consequential
 * AI-adoption stories itself.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { generateText, generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { appRoot, loadEnv, parseArgs, todayISO, harvestSources } from "./_shared.mjs";

loadEnv();
const args = parseArgs(process.argv.slice(2));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("error: ANTHROPIC_API_KEY not set (in .env.local). The content engine needs it.");
  process.exit(1);
}

const date = typeof args.date === "string" ? args.date : todayISO();
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error(`error: --date must be YYYY-MM-DD (got "${date}")`);
  process.exit(1);
}
const count = Math.max(3, Math.min(8, parseInt(args.count, 10) || 6));
const model = typeof args.model === "string" ? args.model : process.env.SIGNALS_MODEL || "claude-sonnet-4-6";

const StorySchema = z.object({
  tag: z.string().max(40),
  source: z.string().max(120),
  title: z.string().max(200),
  excerpt: z.string().max(400),
  url: z.string().max(400),
  why: z.string().max(500),
});
const IssueSchema = z.object({
  headline: z.string().max(160),
  dek: z.string().max(400),
  stories: z.array(StorySchema).min(1),
});

const SYSTEM = `You are the editor of "FinishLine Intelligence — AI Signals", a daily briefing for CEOs and business owners. Your reader is time-poor and wants to know whether each AI development means they should act, wait, or ignore it. House voice: blunt, anti-hype, execution-over-theater, ROI-literate. No buzzword salad, no exclamation points.

For every story you must:
- Summarize the development neutrally in 1–2 sentences (excerpt).
- Then write "why" — the bottom-line implication for a mid-market business owner: cost, revenue, competitive risk, or a concrete use case. Tie it to a decision, not a vibe. 1–3 sentences.
- Pick a one-word category tag (Regulation, Models, Agents, Security, Hardware, Infrastructure, Talent, Adoption, etc).
Never invent URLs or sources. Use only real, current developments.`;

let rawItems = "";
let sources = [];

if (typeof args.input === "string" && existsSync(args.input)) {
  const items = JSON.parse(readFileSync(args.input, "utf8"));
  rawItems = JSON.stringify(items, null, 2);
  sources = [...new Set(items.map((i) => i.source).filter(Boolean))];
  console.log(`Using ${Array.isArray(items) ? items.length : "?"} items from ${args.input}`);
} else {
  console.log(`Researching the week's top AI-adoption stories via web search (${model})…`);
  const research = await generateText({
    model: anthropic(model),
    system: SYSTEM,
    prompt:
      `Find the ${count} most consequential AI-adoption developments from the last 7–10 days that a CEO or business owner should know about. ` +
      `Favor stories with real bottom-line consequences (new capable models, agent/automation launches, pricing shifts, regulation, security incidents, major enterprise adoption). ` +
      `For each, note the headline, the source/outlet, a real URL, and what happened. Search the web to ground every item.`,
    tools: { web_search: anthropic.tools.webSearch_20260209({ maxUses: 6 }) },
    maxOutputTokens: 4000,
  });
  rawItems = research.text;
  sources = harvestSources(research.steps).slice(0, 8);
}

console.log("Composing the briefing…");
const { object } = await generateObject({
  model: anthropic(model),
  schema: IssueSchema,
  schemaName: "Issue",
  schemaDescription: "A FinishLine AI Signals briefing: hero + scored stories with bottom-line 'why' angles.",
  system: SYSTEM,
  temperature: 0.5,
  maxOutputTokens: 4000,
  prompt:
    `Compose an AI Signals issue for ${date} with exactly ${count} stories (or fewer if the source material can't support that many).\n\n` +
    `Write a punchy hero headline (one line, executive altitude) and a one-sentence dek that frames why this set matters now.\n\n` +
    `Source material:\n${rawItems}`,
});

const issue = {
  date,
  title: `AI Signals | ${new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}`,
  headline: object.headline,
  dek: object.dek,
  reviewedAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZone: "America/Los_Angeles" }) + " PT",
  sources: sources.length ? sources : [...new Set(object.stories.map((s) => s.source).filter(Boolean))].slice(0, 6),
  readingTime: `${Math.max(2, Math.round(object.stories.length * 0.7))} min`,
  stories: object.stories,
};

const outDir = join(appRoot, "content", "signals");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${date}.json`);
writeFileSync(outPath, JSON.stringify(issue, null, 2) + "\n", "utf8");

console.log("");
console.log(`✓ Wrote ${issue.stories.length}-story issue → content/signals/${date}.json`);
console.log(`  Headline: ${issue.headline}`);
console.log(`  View at /signals/${date}`);
console.log(`  Repurpose to outbound: npm run outbound -- --date=${date}`);
