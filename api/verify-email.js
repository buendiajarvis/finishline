// Gate for the homepage chatbot demo: require a real business email before
// letting a visitor chat. Free consumer providers are rejected outright;
// everything else is confirmed deliverable via a live MX lookup against
// Cloudflare's DNS-over-HTTPS resolver (no signup, no API key).

const FREE_PROVIDERS = new Set([
  'gmail.com', 'googlemail.com',
  'yahoo.com', 'ymail.com', 'rocketmail.com',
  'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com',
  'protonmail.com', 'proton.me',
  'gmx.com', 'gmx.net',
  'mail.com',
  'yandex.com', 'yandex.ru',
  'zoho.com',
  'qq.com', '163.com', '126.com',
  'inbox.com',
  'fastmail.com'
]);

const EMAIL_RE = /^[^\s@]+@([^\s@]+\.[^\s@]+)$/;

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

  const email = String(data.email || '').trim().toLowerCase();
  const match = email.match(EMAIL_RE);
  if (!match || email.length > 254) {
    return res.status(400).json({ valid: false, reason: 'format', error: 'Enter a valid email address.' });
  }

  const domain = match[1];

  if (FREE_PROVIDERS.has(domain)) {
    return res.status(200).json({ valid: false, reason: 'free_provider', error: 'Use your business email — not a free provider like Gmail, Yahoo, or Outlook.' });
  }

  try {
    const mxRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`, {
      headers: { accept: 'application/dns-json' }
    });
    if (!mxRes.ok) {
      return res.status(200).json({ valid: false, reason: 'lookup_failed', error: "Couldn't verify that domain. Check for typos and try again." });
    }
    const mxData = await mxRes.json();
    const hasMx = Array.isArray(mxData.Answer) && mxData.Answer.some(r => r.type === 15);
    if (!hasMx) {
      return res.status(200).json({ valid: false, reason: 'no_mx', error: "That domain can't receive email. Check for typos and try again." });
    }
  } catch (error) {
    console.error('MX lookup error:', error?.message || 'unknown');
    return res.status(200).json({ valid: false, reason: 'lookup_failed', error: "Couldn't verify that domain. Try again." });
  }

  // Log the verified lead to Google Sheets. Best-effort: a Sheets outage
  // never blocks the visitor from proceeding to the chat.
  const sheetsUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (sheetsUrl) {
    try {
      // Apps Script's doPost redirects (302) to serve the response, and that
      // redirect target only accepts GET — fetch() follows redirects and
      // auto-downgrades POST to GET on 302 per the WHATWG spec, same as a
      // browser, so this "just works" without any special handling.
      await fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // avoids a CORS-preflight-shaped request
        body: JSON.stringify({ source: 'homepage-chatbot', email })
      });
    } catch (error) {
      console.error('Sheets webhook error:', error?.message || 'unknown');
    }
  }

  return res.status(200).json({ valid: true });
};
