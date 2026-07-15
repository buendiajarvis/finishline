const MAX_TURNS = 10; // user messages per demo session
const MAX_SESSION_MS = 5 * 60 * 1000; // 5 minute demo window
const MAX_MESSAGE_CHARS = 2000;
const MAX_DOCUMENT_CHARS = 45000; // extract-doc caps at 40k; a little slack, hard ceiling regardless of caller
// Routed through Vercel AI Gateway (not api.anthropic.com directly) so every
// request carries Vercel's negotiated zero-data-retention agreement with
// Anthropic — see providerOptions.gateway.zeroDataRetention below.
const MODEL = 'anthropic/claude-haiku-4-5';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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

  // Restrict to same-site calls — this endpoint is not a public API.
  const origin = req.headers.origin || req.headers.referer || '';
  if (!/^https:\/\/([a-z0-9-]+\.)*finishlinemsp\.com(\/|$)/i.test(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { document, history, message, sessionStart, email } = data;

  if (!document || typeof document !== 'string') {
    return res.status(400).json({ error: 'Upload a document first.' });
  }
  if (document.length > MAX_DOCUMENT_CHARS) {
    return res.status(400).json({ error: 'Document too large.' });
  }
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({ error: 'Message too long for the demo.' });
  }

  const turns = Array.isArray(history) ? history : [];
  if (turns.length > MAX_TURNS * 2) {
    return res.status(400).json({ error: 'Conversation too long. Refresh to start a new session.' });
  }
  const userTurns = turns.filter(m => m.role === 'user').length + 1;
  if (userTurns > MAX_TURNS) {
    return res.status(429).json({ error: 'Demo limit reached (10 messages). Refresh to start a new session.' });
  }
  if (sessionStart && Date.now() - Number(sessionStart) > MAX_SESSION_MS) {
    return res.status(429).json({ error: 'Demo session expired (5 minute limit). Refresh to start a new session.' });
  }

  // Lead notification — fire once per session, on the first message only.
  // Only the gated business email is sent, never chat/document content.
  // Awaited (not fire-and-forget) since a serverless function can be frozen
  // the instant the response is sent, killing any unawaited work.
  if (userTurns === 1 && email && process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'FinishLine MSP <register@aiworx4me.com>',
          to: ['phil@finishlinemsp.com'],
          subject: 'New chatbot demo lead',
          text: `Business email: ${email}\n\nStarted the homepage AI support demo just now.\n\n---\nfinishlinemsp.com`
        })
      });
    } catch (e) {
      console.error('Lead notification error:', e?.message || 'unknown');
      // never block the chat on this
    }
  }

  // AI_GATEWAY_API_KEY if set, otherwise fall back to the OIDC token Vercel
  // auto-injects into functions on this project — no manual key needed.
  const gatewayKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!gatewayKey) {
    console.error('No AI Gateway credential available');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const systemPrompt = `You are a demo support assistant for FinishLine MSP, showing how document-scoped Q&A works. You must answer ONLY using information contained in the document below. Never use outside knowledge, even if you know the answer.

If the user asks something the document doesn't cover, say plainly that the uploaded document doesn't contain that information — don't guess or fill gaps.

Keep answers brief (a few sentences). This is a live demo other visitors will also use.

--- DOCUMENT START ---
${document}
--- DOCUMENT END ---`;

  const messages = [
    ...turns
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: String(m.content).slice(0, MAX_MESSAGE_CHARS) })),
    { role: 'user', content: message }
  ];

  try {
    const aiRes = await fetch('https://ai-gateway.vercel.sh/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': gatewayKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: systemPrompt,
        messages,
        providerOptions: {
          gateway: { zeroDataRetention: true }
        }
      })
    });

    if (!aiRes.ok) {
      // Never log the response body — on some error types (e.g. content
      // policy) Anthropic echoes the offending user text back, and that
      // would leak into Vercel's log retention.
      console.error('AI Gateway error, status:', aiRes.status);
      return res.status(502).json({ error: 'Assistant is unavailable right now. Try again shortly.' });
    }

    const result = await aiRes.json();
    const reply = result.content?.[0]?.text || '';
    return res.status(200).json({ reply, turnsUsed: userTurns, turnsMax: MAX_TURNS });
  } catch (error) {
    // Log only the error type/message, never request/response payloads.
    console.error('Chatbot call error:', error?.message || 'unknown');
    return res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
};
