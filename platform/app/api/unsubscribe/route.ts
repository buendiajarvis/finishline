import { verifyUnsubToken, addSuppression } from "@/lib/suppression";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function page(title: string, message: string, ok: boolean): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title></head>
<body style="margin:0;background:#0c1324;color:#dce1fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<div style="max-width:460px;margin:96px auto;padding:0 20px;text-align:center;">
  <div style="font-family:ui-monospace,monospace;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${ok ? "#00f0ff" : "#ffb4ab"};">FinishLine</div>
  <h1 style="font-size:22px;margin:16px 0 8px;color:#dce1fb;">${title}</h1>
  <p style="color:#b9cacb;font-size:15px;line-height:1.6;">${message}</p>
</div></body></html>`;
  return new Response(html, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function handle(email: string | null, token: string | null): Promise<Response> {
  if (!email || !token || !verifyUnsubToken(email, token)) {
    return page("Invalid unsubscribe link", "This unsubscribe link is invalid or expired. Email phil@finishlinemsp.com to be removed.", false);
  }
  const persisted = await addSuppression(email, "unsubscribe");
  if (!persisted) {
    // Don't claim success we couldn't durably record (read-only FS + no DB).
    return page(
      "Couldn't complete unsubscribe",
      `We couldn't record your opt-out automatically. Please email phil@finishlinemsp.com and ${email} will be removed immediately.`,
      false,
    );
  }
  return page("You're unsubscribed", `${email} won't receive any further emails from FinishLine.`, true);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  return handle(url.searchParams.get("email"), url.searchParams.get("token"));
}

// One-click unsubscribe (RFC 8058): mail clients POST to the List-Unsubscribe URL.
export async function POST(request: Request) {
  const url = new URL(request.url);
  let email = url.searchParams.get("email");
  let token = url.searchParams.get("token");
  if (!email || !token) {
    try {
      const form = await request.formData();
      email = email ?? (form.get("email") as string | null);
      token = token ?? (form.get("token") as string | null);
    } catch {
      /* no form body */
    }
  }
  return handle(email, token);
}
