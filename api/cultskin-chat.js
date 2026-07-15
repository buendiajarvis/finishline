const MAX_TURNS = 10; // messages per session
const MAX_SESSION_MS = 10 * 60 * 1000; // 10 minute session window
const MAX_MESSAGE_CHARS = 2000;
const MODEL = 'anthropic/claude-haiku-4-5';

// CULT/SKIN's own knowledge base — the assistant answers strictly from this.
const DOCUMENT = `CULT/SKIN — Brand & Product Knowledge Base
"Beauty was never the rulebook. It was the cage."

ABOUT CULT/SKIN
CULT/SKIN launched in 2024 as a rejection of the beauty industry's obsession with "flawless," "natural," and "effortless." We make skincare and makeup for people who show their work — visible texture, bold color, no apology. Every formula is developed in small batches in our Brooklyn lab. No focus groups. No influencer committees. Just a chemist, a tattoo artist, and a very strong opinion about matte black packaging.

We are not clean beauty. We are not "your skin but better." We are ritual, pigment, and permission.

CORE PRODUCTS

1. VOID SERUM — $88
A blue-black tinted barrier serum with 2% ceramide complex and squalane. Wears as a second skin under makeup or alone. Not for "glow" — for depth. Absorbs in 90 seconds, leaves a soft matte finish with a faint cool-toned sheen.

2. RELIC BALM — $54
Multi-use balm for lips, cuticles, and cheekbones. Made with black cumin oil and beeswax. Comes in a squat obsidian-glass jar. Melts on contact, sets to a satin finish. Not sticky, not glossy — described by customers as "like touching a candle that's still slightly warm."

3. SCAR TINT — $46
A blood-red cream blush/lip stain hybrid. Buildable from a bruised flush to full pigment. Stains skin for 6-8 hours. Contains kaolin clay and pomegranate extract. Our best-seller — sells out within 48 hours of every restock.

4. NULL POWDER — $62
A blurring setting powder in one shade: translucent-black-shimmer, invisible on all skin tones. Contains mica and rice starch. Used by makeup artists backstage at underground fashion shows in NYC, Berlin, and Tokyo.

5. THORN LINER — $38
Waterproof gel eyeliner in true black. Precision felt tip. Lasts through crying, sweating, and rain — tested, not claimed, by our own team at three consecutive Berghain nights.

INGREDIENTS & FORMULATION
All CULT/SKIN products are vegan and cruelty-free. We do not test on animals at any stage. Formulas are free of parabens, sulfates, phthalates, and synthetic fragrance. We do use black iron oxide and other cosmetic-grade pigments — these are what give products their signature dark tone and are safe for all skin types, including sensitive skin. Full ingredient lists are printed on every box and available on request.

We do not claim our products are "clean" in the marketing sense — that word has been drained of meaning by the industry. We claim they are formulated by chemists, tested by dermatologists, and honest about what's in them.

SKIN TYPE & SENSITIVITY
VOID SERUM and RELIC BALM are formulated for all skin types, including sensitive and reactive skin. SCAR TINT and NULL POWDER are non-comedogenic and safe for acne-prone skin. THORN LINER is ophthalmologist-tested and safe for contact lens wearers. If you have a known allergy to beeswax, avoid RELIC BALM. If you have a known allergy to mica, avoid NULL POWDER.

SHIPPING
Orders ship within 1-2 business days from our Brooklyn warehouse. Standard shipping (3-5 business days) is $6, or free on orders over $75. Express shipping (1-2 business days) is $18. We currently ship within the United States and Canada only. International shipping is not yet available — we're working on it for 2027.

RETURNS & EXCHANGES
Unopened products can be returned within 30 days of delivery for a full refund. Opened products can be exchanged (not refunded) within 14 days if you experience an adverse reaction — email hello@cultskin.co with a photo and order number and we'll send a replacement or store credit, no questions asked. We do not accept returns on final-sale items, which are marked as such at checkout.

RESTOCKS & DROPS
CULT/SKIN does not do "always in stock." We release in limited monthly batches announced 48 hours in advance on our email list and Instagram (@cultskin). Past drops have sold out in under 10 minutes. Signing up for restock alerts is the only way to guarantee access — we do not do waitlists or backorders.

LOYALTY & MEMBERSHIP
THE INNER CIRCLE is our membership program: $12/month gets you guaranteed early access to drops (24 hours before public release), a members-only matte black tote each quarter, and 15% off every order. Cancel anytime from your account page.

WHOLESALE & RETAIL
CULT/SKIN is available at select independent boutiques in Brooklyn, Los Angeles, and Berlin. We do not sell through major retailers or department stores by design — it's part of keeping the brand small and the formulas exactly as intended. For wholesale inquiries, email wholesale@cultskin.co.

CONTACT
General questions: hello@cultskin.co
Wholesale: wholesale@cultskin.co
Press: press@cultskin.co
Response time: within 1 business day, always answered by an actual human on the CULT/SKIN team.`;

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
  // Browsers always send Origin on a cross-fetch POST from our own JS.
  const origin = req.headers.origin || req.headers.referer || '';
  if (!/^https:\/\/([a-z0-9-]+\.)*finishlinemsp\.com(\/|$)/i.test(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { history, message, sessionStart } = data;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({ error: 'Message too long.' });
  }

  const turns = Array.isArray(history) ? history : [];
  // Hard cap on raw entries too — MAX_TURNS below only counts role:"user"
  // entries, so an oversized array of other shapes would otherwise slip
  // through and inflate the prompt sent to the model.
  if (turns.length > MAX_TURNS * 2) {
    return res.status(400).json({ error: 'Conversation too long. Refresh to start a new chat.' });
  }
  const userTurns = turns.filter(m => m.role === 'user').length + 1;
  if (userTurns > MAX_TURNS) {
    return res.status(429).json({ error: 'Session limit reached. Refresh to start a new chat.' });
  }
  if (sessionStart && Date.now() - Number(sessionStart) > MAX_SESSION_MS) {
    return res.status(429).json({ error: 'Session expired. Refresh to start a new chat.' });
  }

  const gatewayKey = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!gatewayKey) {
    console.error('No AI Gateway credential available');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const systemPrompt = `You are the customer support assistant for CULT/SKIN, a skincare and makeup brand. You must answer ONLY using information in the knowledge base below. Never use outside knowledge, even if you know the answer.

If a customer asks something the knowledge base doesn't cover, say plainly that you don't have that information and point them to hello@cultskin.co. Don't guess or fill gaps.

Match the brand voice: direct, a little dry, no corporate fluff, no exclamation points. Keep answers brief — a few sentences.

--- KNOWLEDGE BASE START ---
${DOCUMENT}
--- KNOWLEDGE BASE END ---`;

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
      console.error('AI Gateway error, status:', aiRes.status);
      return res.status(502).json({ error: 'Chat is unavailable right now. Try again shortly.' });
    }

    const result = await aiRes.json();
    const reply = result.content?.[0]?.text || '';
    return res.status(200).json({ reply, turnsUsed: userTurns, turnsMax: MAX_TURNS });
  } catch (error) {
    console.error('Chat call error:', error?.message || 'unknown');
    return res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
};
