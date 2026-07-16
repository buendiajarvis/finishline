const dns = require('node:dns/promises');
const net = require('node:net');
const http = require('node:http');
const https = require('node:https');

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

// SSRF guard: block any address that is private, loopback, link-local, or
// cloud-metadata. Demo accepts arbitrary user-supplied URLs server-side, so
// this is not optional.
function isBlockedIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 169 && b === 254) return true; // link-local + cloud metadata
    if (a === 0) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1') return true; // loopback
    if (lower.startsWith('fe80:')) return true; // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    if (lower.startsWith('::ffff:')) return isBlockedIp(lower.slice(7)); // IPv4-mapped
    return false;
  }
  return true; // unrecognized format, refuse
}

// Require a real domain name — refuse IP-literal hosts outright (decimal,
// hex, octal, and IPv6-literal forms are all still just "an IP address" to
// net.isIP once URL parsing normalizes them). A page-crawl demo has no
// legitimate reason to hit a bare IP, and this closes every IP-obfuscation
// trick before DNS even enters the picture.
function isIpLiteral(hostname) {
  return net.isIP(hostname) !== 0;
}

// Resolve once, validate every returned address, then hand back a single
// pinned IP. The caller must connect to *this exact IP* — never re-resolve
// the hostname — or a DNS-rebinding attacker can flip the record between our
// check and the actual TCP connection and land on an internal address.
async function resolvePinnedIp(hostname) {
  let records;
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch (e) {
    throw new Error('dns_failed');
  }
  if (!records.length || records.some(r => isBlockedIp(r.address))) {
    throw new Error('blocked_host');
  }
  return records[0];
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

// Fetch one hop: resolve + validate the host, pin the TCP connection to that
// validated IP (Host header / TLS SNI still use the original hostname so
// virtual hosting and cert validation both work), and cap the body while
// streaming so a lying content-length or a slow drip can't force us to
// buffer past MAX_BYTES.
function fetchOneHop(parsed, timeoutMs) {
  return new Promise(async (resolve, reject) => {
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return reject(new Error('bad_protocol'));
    }
    if (isIpLiteral(parsed.hostname)) {
      return reject(new Error('blocked_host'));
    }
    const port = parsed.port ? Number(parsed.port) : (parsed.protocol === 'https:' ? 443 : 80);
    if (port !== 80 && port !== 443) {
      return reject(new Error('blocked_port'));
    }

    let pinned;
    try {
      pinned = await resolvePinnedIp(parsed.hostname);
    } catch (e) {
      return reject(e);
    }

    const transport = parsed.protocol === 'https:' ? https : http;
    const req = transport.request({
      host: pinned.address,
      family: pinned.family,
      port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      timeout: timeoutMs,
      headers: {
        'Host': parsed.host,
        'User-Agent': 'FinishLineDemoBot/1.0 (+https://finishlinemsp.com/demo)'
      },
      // TLS: verify the certificate against the real hostname, not the IP
      // we're pinning the socket to.
      servername: parsed.protocol === 'https:' ? parsed.hostname : undefined,
      // Belt-and-suspenders: even if something upstream tried to re-resolve,
      // force any lookup back to the single address we already validated.
      lookup: (_hostname, _options, cb) => cb(null, pinned.address, pinned.family)
    }, (response) => {
      const chunks = [];
      let total = 0;
      let settled = false;

      response.on('data', (chunk) => {
        total += chunk.length;
        if (total > MAX_BYTES) {
          settled = true;
          response.destroy();
          req.destroy();
          reject(new Error('too_large'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        if (settled) return;
        resolve({
          statusCode: response.statusCode,
          headers: response.headers,
          body: Buffer.concat(chunks)
        });
      });
      response.on('error', (e) => {
        if (settled) return;
        reject(e);
      });
    });

    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
    req.on('error', (e) => {
      if (e.message === 'timeout') {
        const err = new Error('timeout');
        err.name = 'AbortError';
        return reject(err);
      }
      reject(e);
    });
    req.end();
  });
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
function extractPriorityLinks(html, baseUrl, limit) {
  const seen = new Set([baseUrl.toString()]);
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

    const key = linkUrl.toString();
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

function extractTitle(html, fallback) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return titleMatch ? titleMatch[1].trim().slice(0, 200) : fallback;
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

module.exports = async (req, res) => {
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
      for (const outcome of settled) {
        if (outcome.status === 'fulfilled') {
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
};
