#!/usr/bin/env node
/**
 * FinishLine — Repurpose a Signals issue into outbound content.
 *
 * Reads content/signals/<date>.json and asks Claude to turn it into ready-to-ship
 * outbound assets in the FinishLine voice: a LinkedIn post, a cold-email angle,
 * five subject lines, and a short newsletter blurb. Output is a markdown file at
 * content/outbound/<date>.md for the operator to review and ship.
 *
 * Usage: node scripts/build-outbound.mjs [--date=YYYY-MM-DD] [--model=claude-sonnet-4-6]
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { appRoot, loadEnv, parseArgs } from "./_shared.mjs";

loadEnv();
const args = parseArgs(process.argv.slice(2));

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("error: ANTHROPIC_API_KEY not set (in .env.local).");
  process.exit(1);
}

const signalsDir = join(appRoot, "content", "signals");
let date = typeof args.date === "string" ? args.date : null;
if (!date) {
  const files = existsSync(signalsDir) ? readdirSync(signalsDir).filter((f) => f.endsWith(".json")).sort() : [];
  if (!files.length) {
    console.error("error: no issues found. Run `npm run signals` first.");
    process.exit(1);
  }
  date = files[files.length - 1].replace(/\.json$/, "");
}

const issuePath = join(signalsDir, `${date}.json`);
if (!existsSync(issuePath)) {
  console.error(`error: no issue at content/signals/${date}.json`);
  process.exit(1);
}
const issue = JSON.parse(readFileSync(issuePath, "utf8"));
const model = typeof args.model === "string" ? args.model : process.env.SIGNALS_MODEL || "claude-sonnet-4-6";

const OutboundSchema = z.object({
  linkedinPost: z.string().max(2000),
  newsletterBlurb: z.string().max(1200),
  coldEmail: z.object({ subject: z.string().max(90), body: z.string().max(1800) }),
  subjectLines: z.array(z.string().max(90)).min(3).max(7),
});

const SYSTEM = `You write outbound marketing for FinishLine, an AI-transformation consultancy for CEOs & business owners. Voice: blunt, anti-hype, execution-over-theater, ROI-first. No emojis, no exclamation points, no buzzword salad. Always tie AI developments to the reader's bottom line and FinishLine's offer (a 60-minute AI opportunity review; production use cases shipped in weeks). Soft CTA, never pushy.`;

console.log(`Repurposing content/signals/${date}.json with ${model}…`);
const { object } = await generateObject({
  model: anthropic(model),
  schema: OutboundSchema,
  schemaName: "Outbound",
  schemaDescription: "Repurposed outbound assets derived from a Signals issue.",
  system: SYSTEM,
  temperature: 0.6,
  maxOutputTokens: 2500,
  prompt:
    `Turn this AI Signals issue into outbound assets:\n\n` +
    `Headline: ${issue.headline}\nDek: ${issue.dek}\n\nStories:\n` +
    issue.stories.map((s, i) => `${i + 1}. [${s.tag}] ${s.title} — ${s.excerpt} (Why: ${s.why})`).join("\n") +
    `\n\nProduce:\n- linkedinPost: a 120–180 word LinkedIn post from Phil (founder voice) anchored on the single most business-relevant story.\n- newsletterBlurb: a 2–3 sentence teaser linking to the full briefing.\n- coldEmail: a subject + 110-word body opening a conversation off the most relevant story.\n- subjectLines: 5 alternative cold-email subject lines (<60 chars, lowercase-ish).`,
});

const md = `# FinishLine outbound — ${date}

> Repurposed from the AI Signals issue: **${issue.headline}**
> Review before sending. Generated ${new Date().toISOString()}.

## LinkedIn post

${object.linkedinPost}

## Newsletter blurb

${object.newsletterBlurb}

## Cold email

**Subject:** ${object.coldEmail.subject}

${object.coldEmail.body}

## Subject-line variants

${object.subjectLines.map((s) => `- ${s}`).join("\n")}
`;

const outDir = join(appRoot, "content", "outbound");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${date}.md`);
writeFileSync(outPath, md, "utf8");

console.log(`\n✓ Wrote outbound assets → content/outbound/${date}.md`);
console.log(`  ${object.subjectLines.length} subject lines, 1 LinkedIn post, 1 cold email, 1 blurb.`);
