import { z } from "zod";
import { runLeadGen, ingestCandidatesToCrm } from "@/lib/leadgen";
import { crmAuthError } from "@/lib/crm-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BodySchema = z.object({
  segment: z.string().trim().min(2).max(200),
  location: z.string().trim().max(160).optional(),
  count: z.number().int().min(1).max(25).optional(),
  /** When true, upsert the found candidates straight into the CRM. */
  ingest: z.boolean().optional(),
});

export async function POST(request: Request) {
  const denied = crmAuthError(request, "Lead-gen");
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { segment, location, count, ingest } = parsed.data;
  try {
    const result = await runLeadGen({ segment, location: location ?? null, count });
    let ingested = 0;
    if (ingest && result.candidates.length) {
      ingested = await ingestCandidatesToCrm(result.candidates, location ? `${segment} in ${location}` : segment, result.sources);
    }
    return Response.json({
      ok: true,
      segment,
      location: location ?? null,
      model: result.model,
      grounded: result.grounded,
      found: result.candidates.length,
      ingested,
      sources: result.sources.slice(0, 10),
      candidates: result.candidates,
      ...(result.note ? { note: result.note } : {}),
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Lead-gen failed" }, { status: 500 });
  }
}
