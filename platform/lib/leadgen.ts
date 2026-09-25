/**
 * Managed-agent lead-gen engine.
 *
 * Where RealtorCite reverse-prospected ("ask the LLMs who the best agent is"),
 * FinishLine sources businesses that are *ripe for AI transformation*. The
 * agent is a Claude model (`claude-sonnet-4-6`) equipped with the web_search
 * tool. It runs in two grounded passes — mirroring the template's single/two-
 * pass strategy — so candidates are backed by real web sources rather than
 * parametric guesses:
 *
 *   Pass 1 (research): a multi-step web_search agent finds real businesses in a
 *     target segment (industry × geography) and notes concrete AI-readiness
 *     signals it can see on the open web.
 *   Pass 2 (structure): a second call distills the grounded research into a
 *     validated list of scored leads.
 *
 * Candidates can then be ingested into the CRM as outbound contacts. Every AI
 * surface degrades gracefully: with no ANTHROPIC_API_KEY the engine returns an
 * empty result with an explanatory note rather than throwing.
 */
import { generateText, generateObject, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { hasAnthropic, leadgenModelId } from "./ai";
import { upsertContact } from "./crm";

export const LeadCandidateSchema = z.object({
  company: z.string().min(1).max(160),
  website: z.string().max(300).nullable(),
  contactName: z.string().max(120).nullable(),
  contactTitle: z.string().max(120).nullable(),
  location: z.string().max(160).nullable(),
  industry: z.string().max(120).nullable(),
  /** Observable signals that this business is ripe for AI transformation. */
  signals: z.array(z.string().max(200)),
  /** The specific, plausible AI use case FinishLine could ship for them. */
  aiOpportunity: z.string().max(400),
  /** 0–100 readiness/fit score the model assigns from the signals. */
  readinessScore: z.number().int().min(0).max(100),
});

export type LeadCandidate = z.infer<typeof LeadCandidateSchema>;

const LeadListSchema = z.object({
  leads: z.array(LeadCandidateSchema).min(0),
});

export type LeadGenResult = {
  candidates: LeadCandidate[];
  sources: string[];
  model: string;
  grounded: boolean;
  note?: string;
};

const RESEARCH_SYSTEM = `You are a B2B prospecting researcher for FinishLine, an AI-transformation consultancy that helps CEOs and business owners put high-ROI AI into production.

Your job: find REAL businesses in the requested segment that show concrete signs of being ripe for AI transformation, using web search. Ripe signals include:
- Labor-heavy, repetitive back-office or customer-facing workflows (intake, scheduling, quoting, claims, support, data entry).
- Actively hiring for operations / admin / coordinator / support roles (a tell that they'd otherwise automate).
- A real website but dated tooling, manual forms, or no mention of AI/automation.
- Visible growth (new locations, funding, expansion) that strains manual processes.
- Mid-market or SMB size — big enough to have budget, small enough to move fast.

Rules:
- Only include businesses you can actually find on the open web. Never invent companies, people, or URLs. If you can confidently name only a few, that is fine.
- Prefer naming the owner/CEO/founder and their title when the site or a profile shows it.
- Be concrete about WHY each is ripe and WHAT AI use case would move their bottom line.`;

const STRUCTURE_SYSTEM = `Extract a clean, deduplicated list of prospect businesses from the research notes.
For each: company, website (or null), contactName + contactTitle (or null), location, industry, the observable readiness signals, a one-sentence AI opportunity, and a readinessScore (0–100) reflecting how strong the AI-transformation fit is. Include only businesses actually named in the research. An empty list is acceptable if the research found nothing concrete.`;

/** Defensive harvest of source URLs from web_search tool results. */
function harvestSources(
  steps: Array<{ toolResults?: Array<{ output?: unknown }> }> | undefined,
): string[] {
  const urls = new Set<string>();
  for (const step of steps ?? []) {
    for (const tr of step.toolResults ?? []) {
      const out = tr.output;
      if (!Array.isArray(out)) continue;
      for (const item of out) {
        if (item && typeof item === "object" && "url" in item) {
          const url = (item as { url?: unknown }).url;
          if (typeof url === "string") urls.add(url);
        }
      }
    }
  }
  return [...urls];
}

export async function runLeadGen(opts: {
  segment: string;
  location?: string | null;
  count?: number;
}): Promise<LeadGenResult> {
  const model = leadgenModelId();
  const count = Math.min(Math.max(opts.count ?? 8, 1), 25);
  const where = opts.location ? ` in ${opts.location}` : "";
  const target = `${opts.segment}${where}`;

  if (!hasAnthropic()) {
    return {
      candidates: [],
      sources: [],
      model,
      grounded: false,
      note: "ANTHROPIC_API_KEY not set — lead-gen agent is disabled. Add the key to source live leads.",
    };
  }

  // ── Pass 1: grounded web research (multi-step agent) ──
  let researchText = "";
  let sources: string[] = [];
  try {
    const research = await generateText({
      model: anthropic(model),
      system: RESEARCH_SYSTEM,
      prompt:
        `Find up to ${count} real businesses in this segment: ${target}.\n` +
        `For each, capture: business name, website, the owner/CEO/founder name + title if visible, ` +
        `location, what they do, and the specific signals that they're ripe for AI transformation. ` +
        `Search the web to ground every business in a real source.`,
      tools: {
        web_search: anthropic.tools.webSearch_20260209({ maxUses: 5 }),
      },
      stopWhen: stepCountIs(8),
      maxOutputTokens: 4000,
    });
    researchText = research.text;
    sources = harvestSources(research.steps as never);
  } catch (err) {
    return {
      candidates: [],
      sources: [],
      model,
      grounded: false,
      note: `Web research failed: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }

  if (!researchText.trim()) {
    return { candidates: [], sources, model, grounded: true, note: "Research returned no usable businesses." };
  }

  // ── Pass 2: structure the grounded research into scored leads ──
  try {
    const { object } = await generateObject({
      model: anthropic(model),
      schema: LeadListSchema,
      schemaName: "LeadList",
      schemaDescription: "Structured, scored AI-transformation prospects extracted from grounded research.",
      system: STRUCTURE_SYSTEM,
      temperature: 0.2,
      maxOutputTokens: 4000,
      prompt: `Segment: ${target}\n\nResearch notes:\n${researchText}`,
    });
    // Sort strongest-fit first.
    const candidates = [...object.leads].sort((a, b) => b.readinessScore - a.readinessScore);
    return { candidates, sources, model, grounded: true };
  } catch (err) {
    return {
      candidates: [],
      sources,
      model,
      grounded: true,
      note: `Structuring failed: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }
}

/** Upsert lead-gen candidates into the CRM as outbound contacts. Returns count. */
export async function ingestCandidatesToCrm(
  candidates: LeadCandidate[],
  segment: string,
  sources: string[] = [],
): Promise<number> {
  let n = 0;
  const sourceNote = sources.length ? `Sources: ${sources.slice(0, 5).join(" ")}` : "";
  for (const c of candidates) {
    const notes = [
      `Segment: ${segment}`,
      c.aiOpportunity ? `Opportunity: ${c.aiOpportunity}` : "",
      sourceNote,
    ]
      .filter(Boolean)
      .join(" · ");
    try {
      await upsertContact({
        name: c.contactName?.trim() || c.company,
        company: c.company,
        title: c.contactTitle ?? null,
        website: c.website ?? null,
        location: c.location ?? null,
        industry: c.industry ?? null,
        source: "outbound",
        score: c.readinessScore,
        signals: c.signals,
        aiOpportunity: c.aiOpportunity,
        notes,
      });
      n += 1;
    } catch (err) {
      console.error("[leadgen] CRM upsert failed:", err);
    }
  }
  return n;
}
