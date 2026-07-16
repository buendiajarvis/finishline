const dns = require('node:dns/promises');
const net = require('node:net');

const MAX_BYTES = 3 * 1024 * 1024; // 3MB raw HTML
const MAX_CHARS = 40000; // cap extracted text sent to the model, matches extract-doc
const FETCH_TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;

// SSRF guard: block any hostname that resolves to a private, loopback,
// link-local, or cloud-metadata address. Demo accepts arbitrary user-supplied
// URLs server-side, so this is not optional.
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

async function assertSafeHost(hostname) {
  let records;
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch (e) {
    throw new Error('dns_failed');
  }
  if (!records.length || records.some(r => isBlockedIp(r.address))) {
    throw new Error('blocked_host');
  }
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

async function fetchWithGuard(targetUrl, redirectsLeft) {
  const parsed = new URL(targetUrl);
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('bad_protocol');
  }
  await assertSafeHost(parsed.hostname);

  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(parsed.toString(), {
      redirect: 'manual',
      signal: ctrl.signal,
      headers: { 'User-Agent': 'FinishLineDemoBot/1.0 (+https://finishlinemsp.com/demo)' }
    });
  } finally {
    clearTimeout(timeout);
  }

  if ([301, 302, 303, 307, 308].includes(res.status)) {
    if (redirectsLeft <= 0) throw new Error('too_many_redirects');
    const location = res.headers.get('location');
    if (!location) throw new Error('bad_redirect');
    const nextUrl = new URL(location, parsed).toString();
    return fetchWithGuard(nextUrl, redirectsLeft - 1);
  }

  return res;
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

  let response;
  try {
    response = await fetchWithGuard(normalized.toString(), MAX_REDIRECTS);
  } catch (e) {
    const reason = e?.message || 'unknown';
    if (reason === 'blocked_host' || reason === 'bad_protocol') {
      return res.status(400).json({ error: "Can't fetch that address for the demo." });
    }
    if (reason === 'dns_failed') {
      return res.status(422).json({ error: "Couldn't resolve that domain. Check for typos." });
    }
    if (e?.name === 'AbortError') {
      return res.status(504).json({ error: 'That site took too long to respond.' });
    }
    console.error('Fetch error:', reason);
    return res.status(502).json({ error: "Couldn't reach that site." });
  }

  if (!response.ok) {
    return res.status(422).json({ error: `Site responded with ${response.status}. Try a different page.` });
  }

  const contentType = response.headers.get('content-type') || '';
  if (!/text\/html|text\/plain|application\/xhtml/i.test(contentType)) {
    return res.status(422).json({ error: 'That URL is not a readable web page (expected HTML).' });
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > MAX_BYTES) {
    return res.status(413).json({ error: 'That page is too large for the demo.' });
  }

  let html;
  try {
    const buf = await response.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return res.status(413).json({ error: 'That page is too large for the demo.' });
    }
    html = Buffer.from(buf).toString('utf-8');
  } catch (e) {
    console.error('Body read error:', e?.constructor?.name || 'unknown');
    return res.status(502).json({ error: 'Could not read that page.' });
  }

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim().slice(0, 200) : normalized.hostname;

  let text = stripHtml(html);
  if (!text) {
    return res.status(422).json({ error: 'No readable text found on that page.' });
  }

  let truncated = false;
  if (text.length > MAX_CHARS) {
    text = text.slice(0, MAX_CHARS);
    truncated = true;
  }

  return res.status(200).json({ text, truncated, chars: text.length, title, sourceUrl: normalized.toString() });
};
