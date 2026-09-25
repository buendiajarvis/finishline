/**
 * Shared gate for the internal CRM + lead-gen routes.
 *
 * If CRM_TOKEN is set, require it via the `Authorization: Bearer <token>` header
 * (constant-time compared). If it is NOT set, allow in local dev but refuse
 * (503) in production so a deployed instance never exposes prospect/lead PII
 * without an explicit token.
 *
 * The token is accepted via the Authorization header ONLY — never a `?token=`
 * query param, which would leak the secret into server/proxy logs, browser
 * history, and Referer headers (CWE-598).
 */
import { timingSafeEqual } from "node:crypto";

function safeEq(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function crmAuthError(request: Request, label = "CRM"): Response | null {
  const token = process.env.CRM_TOKEN;
  if (!token) {
    if (process.env.NODE_ENV === "production") {
      return Response.json({ error: `${label} disabled. Set CRM_TOKEN to enable.` }, { status: 503 });
    }
    return null;
  }
  const bearer = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!safeEq(bearer, token)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
