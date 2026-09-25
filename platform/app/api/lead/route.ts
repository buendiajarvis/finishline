import { z } from "zod";
import { persistLead } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

// Lightweight in-memory rate limit (per-process; best-effort). Good enough to
// blunt accidental double-submits and trivial abuse on a low-volume form.
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function clientIp(request: Request): string {
  // x-real-ip is set by Vercel's proxy and harder to spoof than x-forwarded-for.
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = request.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? "unknown").trim();
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (HITS.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  if (arr.length === 0) HITS.delete(ip);
  else HITS.set(ip, arr);
  // Bound memory: occasionally sweep keys whose newest hit has aged out.
  if (HITS.size > 5000) {
    for (const [k, v] of HITS) if (v.every((t) => now - t >= WINDOW_MS)) HITS.delete(k);
  }
  return arr.length > MAX_PER_WINDOW;
}

const BodySchema = z.object({
  source: z.enum(["assessment", "contact"]).default("contact"),
  email: z.string().trim().email().max(200),
  name: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  company: z.string().trim().max(160).optional(),
  title: z.string().trim().max(120).optional(),
  industry: z.string().trim().max(120).optional(),
  location: z.string().trim().max(160).optional(),
  website: z.string().trim().max(300).optional(),
  message: z.string().trim().max(4000).optional(),
  scope: z.string().trim().max(120).optional(),
  timeline: z.string().trim().max(120).optional(),
  // Honeypot — bots fill it, humans leave it empty. Must PASS validation (so a
  // filled value reaches the silent-drop branch below); the length cap just
  // bounds payload size.
  company_url: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return Response.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    // Don't echo field-level issues publicly (avoids leaking the honeypot field).
    return Response.json({ error: "Please check your name and a valid work email." }, { status: 400 });
  }

  const data = parsed.data;
  // Honeypot tripped → pretend success, drop silently.
  if (data.company_url) return Response.json({ ok: true });

  const lead = {
    source: data.source,
    email: data.email,
    name: data.name,
    phone: data.phone,
    company: data.company,
    title: data.title,
    industry: data.industry,
    location: data.location,
    website: data.website,
    message: data.message,
    scope: data.scope,
    timeline: data.timeline,
  };
  try {
    const record = await persistLead(lead);
    return Response.json({ ok: true, id: record.id });
  } catch (err) {
    console.error("[api/lead] persist failed:", err);
    return Response.json({ error: "Could not record your request. Please email phil@finishlinemsp.com." }, { status: 500 });
  }
}
