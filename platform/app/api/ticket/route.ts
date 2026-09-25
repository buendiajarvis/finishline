import { z } from "zod";
import { persistTicket } from "@/lib/ticket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

// Lightweight in-memory rate limit (per-process, best-effort).
const HITS = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;

function clientIp(request: Request): string {
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
  if (HITS.size > 5000) {
    for (const [k, v] of HITS) if (v.every((t) => now - t >= WINDOW_MS)) HITS.delete(k);
  }
  return arr.length > MAX_PER_WINDOW;
}

const BodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  // Phone-shaped charset only: digits, spaces, and + ( ) - . — rejects letters
  // and control chars (incl. CR/LF) from reaching the notification email.
  phone: z.string().trim().min(7).max(40).regex(/^[0-9+()\-. ]{7,40}$/, "Enter a valid phone number"),
  problem: z.string().trim().min(1).max(4000),
  // Honeypot — bots fill it, humans leave it empty.
  company_url: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return Response.json({ error: "Too many requests. Please wait a moment, or call us directly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Please provide your name, a valid email, a phone number, and a description of the problem." },
      { status: 400 },
    );
  }

  const d = parsed.data;
  // Honeypot tripped → pretend success, drop silently.
  if (d.company_url) return Response.json({ ok: true });

  const r = await persistTicket({ name: d.name, email: d.email, phone: d.phone, problem: d.problem });
  if (!r.ok) {
    return Response.json(
      { error: "We couldn't route your ticket right now. Please email phil@finishlinemsp.com or call us directly." },
      { status: 502 },
    );
  }
  return Response.json({ ok: true, id: r.id });
}
