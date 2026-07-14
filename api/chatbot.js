const MAX_TURNS = 10; // user messages per demo session
const MAX_SESSION_MS = 5 * 60 * 1000; // 5 minute demo window
const MAX_MESSAGE_CHARS = 2000;
const MODEL = 'claude-haiku-4-5-20251001';

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

  const { document, history, message, sessionStart } = data;

  if (!document || typeof document !== 'string') {
    return res.status(400).json({ error: 'Upload a document first.' });
  }
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({ error: 'Message too long for the demo.' });
  }

  const turns = Array.isArray(history) ? history : [];
  const userTurns = turns.filter(m => m.role === 'user').length + 1;
  if (userTurns > MAX_TURNS) {
    return res.status(429).json({ error: 'Demo limit reached (10 messages). Refresh to start a new session.' });
  }
  if (sessionStart && Date.now() - Number(sessionStart) > MAX_SESSION_MS) {
    return res.status(429).json({ error: 'Demo session expired (5 minute limit). Refresh to start a new session.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
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
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: systemPrompt,
        messages
      })
    });

    if (!aiRes.ok) {
      // Never log the response body — on some error types (e.g. content
      // policy) Anthropic echoes the offending user text back, and that
      // would leak into Vercel's log retention.
      console.error('Anthropic API error, status:', aiRes.status);
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
