/**
 * Company-website context for cold-email personalization.
 *
 * Given a contact's email (or an explicit website), derive the company domain,
 * fetch its homepage, and extract usable text (title + meta description + body)
 * to ground the cold-email draft in what the business actually does. Free/
 * personal email providers are skipped (their domain isn't a company site), and
 * every failure path returns null so drafting never breaks.
 *
 * Results are cached per-domain (in-process, 24h) and concurrent fetches for the
 * same domain are de-duplicated — important for bulk `draft_all` runs.
 *
 * SSRF hardening: the host is denied if it's internal/metadata by name, and
 * every hop (including redirects, which are followed manually) is DNS-resolved
 * and rejected if it points at a private/loopback/link-local/ULA address.
 */
import { lookup } from "node:dns/promises";

export type CompanyContext = {
  domain: string;
  url: string;
  title: string;
  description: string;
  text: string;
};

const MAX_TEXT = 2800;
const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 600_000;
const TTL_MS = 24 * 60 * 60 * 1000;

// Personal/free mailbox providers — their domain is never a company site.
const FREE_PROVIDERS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "yahoo.ca", "ymail.com",
  "outlook.com", "hotmail.com", "hotmail.co.uk", "live.com", "msn.com", "passinbox.com",
  "icloud.com", "me.com", "mac.com", "aol.com", "protonmail.com", "proton.me", "pm.me",
  "gmx.com", "gmx.net", "zoho.com", "yandex.com", "yandex.ru", "mail.com", "mail.ru",
  "fastmail.com", "hey.com", "comcast.net", "verizon.net", "att.net", "sbcglobal.net",
  "duck.com", "tutanota.com", "hushmail.com", "163.com", "126.com", "qq.com",
]);

/** Lowercased registrable host derived from a website URL or an email address. */
export function domainFromContact(input: { email?: string | null; website?: string | null }): string | null {
  let host: string | null = null;
  if (input.website && input.website.trim()) {
    const raw = input.website.trim();
    try {
      host = new URL(raw.includes("://") ? raw : `https://${raw}`).hostname;
    } catch {
      host = null;
    }
  }
  if (!host && input.email && input.email.includes("@")) {
    host = input.email.split("@")[1] ?? null;
  }
  if (!host) return null;
  host = host.trim().toLowerCase().replace(/^www\./, "");
  if (!host.includes(".")) return null; // not a real domain
  if (host.includes(":") || host.startsWith("[")) return null; // IPv6 literal
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
  if (host === "metadata.google.internal") return null;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null; // bare IPv4
  if (/\.\d+$/.test(host)) return null; // IP-ish: final label all-numeric
  if (FREE_PROVIDERS.has(host)) return null;
  return host;
}

// ── SSRF egress guard ──
function ipv4Private(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true; // unparseable → unsafe
  const [a, b] = p;
  if (a === 10 || a === 127 || a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata)
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function ipv6Private(ip: string): boolean {
  const a = ip.toLowerCase();
  if (a === "::1" || a === "::") return true;
  if (/^fe[89ab]/.test(a)) return true; // link-local fe80::/10
  if (/^f[cd]/.test(a)) return true; // ULA fc00::/7
  const mapped = a.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return ipv4Private(mapped[1]);
  return false;
}

async function hostResolvesPublic(host: string): Promise<boolean> {
  try {
    const addrs = await lookup(host, { all: true });
    if (!addrs.length) return false;
    for (const { address, family } of addrs) {
      if (family === 6 ? ipv6Private(address) : ipv4Private(address)) return false;
    }
    return true;
  } catch {
    return false; // can't resolve → don't fetch
  }
}

const DECODE: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&apos;": "'",
  "&nbsp;": " ", "&mdash;": "—", "&ndash;": "–", "&rsquo;": "’", "&lsquo;": "‘",
  "&ldquo;": "“", "&rdquo;": "”", "&hellip;": "…",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, d) => { try { return String.fromCodePoint(Number(d)); } catch { return ""; } })
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => DECODE[m.toLowerCase()] ?? " ");
}

/** Extract title, meta description, and readable body text from raw HTML. */
export function htmlToText(html: string): { title: string; description: string; text: string } {
  const title = decodeEntities((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim()).slice(0, 200);
  const description = decodeEntities(
    (html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] ??
      html.match(/<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']*)["']/i)?.[1] ??
      "").trim(),
  ).slice(0, 400);

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const text = decodeEntities(body).replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
  return { title, description, text };
}

const CACHE = new Map<string, { at: number; value: CompanyContext | null }>();
const INFLIGHT = new Map<string, Promise<CompanyContext | null>>();

/**
 * Fetch HTML with SSRF protection: validate every hop's host (name + resolved
 * IP) and follow redirects manually so an off-host 3xx can't reach an internal
 * address. Returns null on any block, failure, or non-HTML response.
 */
async function safeFetchHtml(startUrl: string): Promise<string | null> {
  let url = startUrl;
  for (let hop = 0; hop < 3; hop++) {
    let host: string;
    try {
      host = new URL(url).hostname.replace(/^\[|\]$/g, "").toLowerCase();
    } catch {
      return null;
    }
    if (
      !host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") ||
      host === "metadata.google.internal" || !(await hostResolvesPublic(host))
    ) {
      return null;
    }

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(url, {
        signal: ctrl.signal,
        redirect: "manual",
        headers: {
          "User-Agent": "FinishLineBot/1.0 (+https://www.finishlinemsp.com; outreach research)",
          Accept: "text/html,application/xhtml+xml",
        },
      });
    } catch {
      clearTimeout(timer);
      return null;
    }
    clearTimeout(timer);

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return null; // opaque/blocked redirect → fail safe
      try {
        url = new URL(loc, url).toString();
      } catch {
        return null;
      }
      continue; // re-validate the new host on the next hop
    }
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!/text\/html|xhtml/i.test(ct)) return null;
    const buf = await res.arrayBuffer();
    return new TextDecoder("utf-8").decode(buf.slice(0, MAX_HTML_BYTES));
  }
  return null; // too many redirects
}

async function doFetch(domain: string): Promise<CompanyContext | null> {
  for (const url of [`https://${domain}/`, `https://www.${domain}/`]) {
    const html = await safeFetchHtml(url);
    if (!html) continue;
    const { title, description, text } = htmlToText(html);
    // Skip pages with essentially no usable content (e.g. a JS-only shell).
    if (text.length < 120 && !description) continue;
    return { domain, url, title, description, text };
  }
  return null;
}

/** Fetch (and cache) website context for a contact, or null if unavailable. */
export async function fetchCompanyContext(
  contact: { email?: string | null; website?: string | null },
): Promise<CompanyContext | null> {
  const domain = domainFromContact(contact);
  if (!domain) return null;

  const cached = CACHE.get(domain);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  const inflight = INFLIGHT.get(domain);
  if (inflight) return inflight;

  const p = doFetch(domain)
    .then((value) => {
      CACHE.set(domain, { at: Date.now(), value });
      return value;
    })
    .catch(() => null)
    .finally(() => {
      INFLIGHT.delete(domain);
    });
  INFLIGHT.set(domain, p);
  return p;
}

/** Render context as a compact prompt block (empty string when absent). */
export function companyContextBlock(ctx: CompanyContext | null): string {
  if (!ctx) return "";
  const parts = [
    `Company website (${ctx.url}):`,
    ctx.title ? `Title: ${ctx.title}` : "",
    ctx.description ? `Description: ${ctx.description}` : "",
    ctx.text ? `Page text: ${ctx.text}` : "",
  ].filter(Boolean);
  return parts.join("\n");
}
