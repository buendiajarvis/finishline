import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { crmAuthError } from "@/lib/crm-auth";
import { generateEmail, sendComposed } from "@/lib/compose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("draft"),
    prompt: z.string().trim().min(1).max(4000),
    fromFirstName: z.string().trim().min(1).max(60),
    current: z
      .object({
        to: z.string().max(200).optional(),
        subject: z.string().max(200).optional(),
        body: z.string().max(8000).optional(),
      })
      .optional(),
  }),
  z.object({
    action: z.literal("send"),
    to: z.string().trim().email(),
    subject: z.string().trim().min(1).max(160),
    body: z.string().trim().min(1).max(8000),
    fromFirstName: z.string().trim().min(1).max(60),
  }),
]);

async function appendSentLog(entry: Record<string, unknown>): Promise<void> {
  try {
    const dir = path.join(process.cwd(), "data");
    await fs.mkdir(dir, { recursive: true });
    await fs.appendFile(path.join(dir, "sent-log.jsonl"), JSON.stringify(entry) + "\n", "utf8");
  } catch (err) {
    console.error("[compose] sent-log write failed:", err);
  }
}

export async function POST(request: Request) {
  const denied = crmAuthError(request, "Composer");
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (parsed.data.action === "draft") {
    const { prompt, fromFirstName, current } = parsed.data;
    const result = await generateEmail({ prompt, fromFirstName, current });
    if (!result.ok) return Response.json({ error: result.error }, { status: 502 });
    return Response.json({ ok: true, draft: result.draft, grounded: result.grounded });
  }

  // action === "send"
  const { to, subject, body: emailBody, fromFirstName } = parsed.data;
  const r = await sendComposed({ to, subject, body: emailBody, fromFirstName });
  await appendSentLog({
    at: new Date().toISOString(),
    channel: "compose",
    from: r.from ?? null,
    to,
    subject,
    ok: r.ok,
    id: r.id ?? null,
    ...(r.error ? { error: r.error } : {}),
  });
  if (!r.ok) return Response.json({ error: r.error }, { status: 502 });
  return Response.json({ ok: true, id: r.id, from: r.from });
}
