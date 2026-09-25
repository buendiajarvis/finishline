import { adaptVercelHandler } from '../_lib/adapt.js';

const MAX_BYTES = 3 * 1024 * 1024; // 3MB raw HTML per page, enforced during streaming
const MAX_CHARS_PER_PAGE = 40000; // cap extracted text per page, matches extract-doc
const MAX_TOTAL_CHARS = 80000; // cap combined text across all crawled pages
const SEED_TIMEOUT_MS = 8000;
const SECONDARY_TIMEOUT_MS = 4000;
const TOTAL_BUDGET_MS = 10000; // hard wall-clock cap for the whole crawl
const MAX_REDIRECTS = 3;
const MAX_SECONDARY_PAGES = 5; // seed + up to 5 linked pages = 6 total

// Same-domain links whose path or anchor text hits these are the pages a
// demo visitor is most likely to quiz the bot on — prioritize them over
// nav chrome like login/cart/social.
const PRIORITY_KEYWORDS = ['about', 'pricing', 'faq', 'docs', 'documentation', 'support', 'services', 'contact', 'help'];
const SKIP_KEYWORDS = ['login', 'signin', 'sign-in', 'signup', 'sign-up', 'cart', 'checkout', 'account', 'privacy', 'terms', 'legal', 'cookie'];
const SKIP_EXTENSIONS = /\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|mp4|mp3|css|js|xml|json|ico)$/i;

// SSRF guard, layer 1: require a real domain name — refuse IP-literal hosts
// outright. The WHATWG URL parser normalizes decimal/hex/octal IPv4 forms to
// dotted-decimal for http/https during `new URL()`, so a plain dotted-quad
// (or a hostname containing ':' for IPv6-literal/bracket forms) check here
// catches every IP-obfuscation trick without needing net.isIP.
function isIpLiteral(hostname) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return true;
  if (hostname.includes(':')) return true; // IPv6 literal
  return false;
}

// SSRF guard, layer 2: Cloudflare Workers' fetch() cannot open a raw socket
// or pin a connection to a pre-resolved IP the way a Node `net`/`dns` based
// implementation can — Workers has no socket API for outbound fetch(). The
// platform itself refuses to connect fetch() to loopback, private-network,
// and Cloudflare-internal IP ranges on every call (not just a first check),
// which structurally closes the DNS-rebinding TOCTOU gap the old Node
// implementation had to defend against manually: there is no "check now,
// connect later" window because the block is enforced at connect time, every
// time. A blocked destination surfaces here as a rejected fetch() — treated
// the same as the old 'blocked_host' reason.
function isPlatformBlockedError(e) {
  const msg = (e && e.message || '').toLowerCase();
  return /disallow|proxy request failed|cannot connect to the specified address/.test(msg);
}

function stripHtml(html) {
  let text = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
}

// Fetch one hop: validate scheme/host/port up front, issue the request with
// redirects handled manually (so we can cap MAX_REDIRECTS ourselves), and
// cap the body while streaming so a lying content-length or a slow drip
// can't force us to buffer past MAX_BYTES.
async function fetchOneHop(parsed, timeoutMs) {
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('bad_protocol');
  }
  if (isIpLiteral(parsed.hostname)) {
    throw new Error('blocked_host');
  }
  const port = parsed.port ? Number(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80);
  if (port !== 80 && port !== 443) {
    throw new Error('blocked_port');
  }

  let response;
  try {
    response = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'manual',
      headers: {
        'User-Agent': 'FinishLineDemoBot/1.0 (+https://finishlinemsp.com/demo)'
      },
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch (e) {
    if (isPlatformBlockedError(e)) throw new Error('blocked_host');
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      const err = new Error('timeout');
      err.name = 'AbortError';
      throw err;
    }
    throw e;
  }

  const headers = {};
  for (const [key, value] of response.headers) headers[key.toLowerCase()] = value;

  if ([301, 302, 303, 307, 308].includes(response.status)) {
    return { statusCode: response.status, headers, body: null };
  }

  const reader = response.body ? response.body.getReader() : null;
  const chunks = [];
  let total = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_BYTES) {
        reader.cancel().catch(() => {});
        throw new Error('too_large');
      }
      chunks.push(value);
    }
  }
  const body = Buffer.concat(chunks.map(c => Buffer.from(c)));

  return { statusCode: response.status, headers, body };
}

async function fetchWithGuard(targetUrl, redirectsLeft, timeoutMs) {
  const parsed = new URL(targetUrl);
  const response = await fetchOneHop(parsed, timeoutMs);

  if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
    if (redirectsLeft <= 0) throw new Error('too_many_redirects');
    const location = response.headers.location;
    if (!location) throw new Error('bad_redirect');
    const nextUrl = new URL(location, parsed).toString();
    return fetchWithGuard(nextUrl, redirectsLeft - 1, timeoutMs);
  }

  return { response, finalUrl: parsed };
}

// Pull same-domain links out of the seed page's raw HTML, score them by how
// likely a demo visitor is to ask about that page, and return the top N —
// this is depth-1 only, we never follow links found on a secondary page.
// Canonicalize for dedup only (never for the actual fetch) — nav and footer
// often link the same page via a trailing slash or a tracking query string,
// and without this each variant burns a separate crawl slot on identical
// content.
function canonicalize(url) {
  return url.hostname.toLowerCase() + (url.pathname.replace(/\/+$/, '') || '/');
}

function extractPriorityLinks(html, baseUrl, limit) {
  const seen = new Set([canonicalize(baseUrl)]);
  const candidates = [];
  const anchorRe = /<a\s+[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = anchorRe.exec(html)) !== null) {
    const rawHref = match[1].trim();
    const anchorText = match[2].replace(/<[^>]+>/g, ' ').trim().toLowerCase();
    if (!rawHref || /^(mailto|tel|javascript):/i.test(rawHref)) continue;

    let linkUrl;
    try {
      linkUrl = new URL(rawHref, baseUrl);
    } catch (e) {
      continue;
    }
    if (linkUrl.protocol !== 'http:' && linkUrl.protocol !== 'https:') continue;
    if (linkUrl.hostname !== baseUrl.hostname) continue; // same-domain only
    if (SKIP_EXTENSIONS.test(linkUrl.pathname)) continue;

    const key = canonicalize(linkUrl);
    if (seen.has(key)) continue;
    seen.add(key);

    const haystack = (linkUrl.pathname + ' ' + anchorText).toLowerCase();
    if (SKIP_KEYWORDS.some(k => haystack.includes(k))) continue;

    const score = PRIORITY_KEYWORDS.reduce((s, kw) => haystack.includes(kw) ? s + 1 : s, 0);
    candidates.push({ url: linkUrl, score });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit).map(c => c.url);
}

function decodeEntities(str) {
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTitle(html, fallback) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return titleMatch ? decodeEntities(titleMatch[1]).trim().slice(0, 200) : fallback;
}

async function fetchPage(url, timeoutMs) {
  const result = await fetchWithGuard(url.toString(), MAX_REDIRECTS, timeoutMs);
  const { response, finalUrl } = result;

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error('bad_status');
  }
  const contentType = response.headers['content-type'] || '';
  if (!/text\/html|text\/plain|application\/xhtml/i.test(contentType)) {
    throw new Error('not_html');
  }

  const html = response.body.toString('utf-8');
  const title = extractTitle(html, finalUrl.hostname);
  let text = stripHtml(html);
  if (!text) throw new Error('no_text');

  let truncated = false;
  if (text.length > MAX_CHARS_PER_PAGE) {
    text = text.slice(0, MAX_CHARS_PER_PAGE);
    truncated = true;
  }

  return { html, text, title, truncated, url: finalUrl.toString() };
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const origin = req.headers.origin || req.headers.referer || '';
  if (!/^https:\/\/([a-z0-9-]+\.)*finishlinemsp\.com(\/|$)/i.test(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  let raw = '';
  await new Promise((resolve, reject) => {
    req.on('data', chunk => { raw += chunk.toString(); });
    req.on('end', resolve);
    req.on('error', reject);
  });

  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const inputUrl = String(data.url || '').trim();
  if (!inputUrl) {
    return res.status(400).json({ error: 'url is required' });
  }

  let normalized;
  try {
    normalized = new URL(/^https?:\/\//i.test(inputUrl) ? inputUrl : `https://${inputUrl}`);
  } catch (e) {
    return res.status(400).json({ error: 'That does not look like a valid URL.' });
  }

  const startTime = Date.now();
  let seed;
  try {
    seed = await fetchPage(normalized, SEED_TIMEOUT_MS);
  } catch (e) {
    const reason = e?.message || 'unknown';
    if (reason === 'blocked_host' || reason === 'bad_protocol' || reason === 'blocked_port') {
      return res.status(400).json({ error: "Can't fetch that address for the demo." });
    }
    if (reason === 'dns_failed') {
      return res.status(422).json({ error: "Couldn't resolve that domain. Check for typos." });
    }
    if (reason === 'too_large') {
      return res.status(413).json({ error: 'That page is too large for the demo.' });
    }
    if (reason === 'bad_status') {
      return res.status(422).json({ error: 'That page returned an error. Try a different URL.' });
    }
    if (reason === 'not_html') {
      return res.status(422).json({ error: 'That URL is not a readable web page (expected HTML).' });
    }
    if (reason === 'no_text') {
      return res.status(422).json({ error: 'No readable text found on that page.' });
    }
    if (e?.name === 'AbortError' || reason === 'timeout') {
      return res.status(504).json({ error: 'That site took too long to respond.' });
    }
    console.error('Fetch error:', reason);
    return res.status(502).json({ error: "Couldn't reach that site." });
  }

  // Depth-1 crawl: pull a handful of same-domain links most likely to hold
  // content a demo visitor will ask about, fetch them in parallel, and drop
  // anything still in flight once the total wall-clock budget is spent.
  const seedUrl = new URL(seed.url);
  const links = extractPriorityLinks(seed.html, seedUrl, MAX_SECONDARY_PAGES);

  const pages = [{ url: seed.url, title: seed.title, text: seed.text, truncated: seed.truncated }];

  if (links.length) {
    const remaining = TOTAL_BUDGET_MS - (Date.now() - startTime);
    const perPageTimeout = Math.max(1000, Math.min(SECONDARY_TIMEOUT_MS, remaining));

    if (remaining > 1500) {
      const settled = await Promise.allSettled(
        links.map(link => fetchPage(link, perPageTimeout))
      );
      const seenTitles = new Set([seed.title.toLowerCase()]);
      for (const outcome of settled) {
        if (outcome.status === 'fulfilled') {
          const titleKey = outcome.value.title.toLowerCase();
          if (seenTitles.has(titleKey)) continue; // same content under a different path
          seenTitles.add(titleKey);
          pages.push({
            url: outcome.value.url,
            title: outcome.value.title,
            text: outcome.value.text,
            truncated: outcome.value.truncated
          });
        }
        // Failed/timed-out secondary pages are silently dropped — the seed
        // page always carries the response on its own.
      }
    }
  }

  // Combine, respecting the total char budget across all pages.
  let combined = '';
  let usedChars = 0;
  const included = [];
  for (const page of pages) {
    const header = `--- PAGE: ${page.title} (${page.url}) ---\n`;
    const remainingBudget = MAX_TOTAL_CHARS - usedChars;
    if (remainingBudget <= header.length) break;
    const slice = page.text.slice(0, remainingBudget - header.length);
    combined += header + slice + '\n\n';
    usedChars += header.length + slice.length;
    included.push({ url: page.url, title: page.title });
  }

  const truncated = pages.some(p => p.truncated) || usedChars >= MAX_TOTAL_CHARS;
  const label = included.length > 1
    ? `${included.length} pages from ${seedUrl.hostname}`
    : seed.title;

  return res.status(200).json({
    text: combined.trim(),
    truncated,
    chars: combined.length,
    title: label,
    sourceUrl: seed.url,
    pages: included
  });
}

export const onRequestPost = adaptVercelHandler(handler);
