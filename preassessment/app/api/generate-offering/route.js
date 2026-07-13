// app/api/generate-offering/route.js
//
// Takes the complete set of answers (base questions + AI follow-ups)
// and generates the personalized situation analysis / recommendations /
// roadmap / ROI offering shown to the respondent. The response is returned
// as two separate fields — situationAnalysis (shown free) and fullPlan
// (shown only after the diagnostic fee is paid) — so the client never has
// to guess where to split a single blob of markdown.

export async function POST(request) {
  try {
    const answers = await request.json();

    const prompt = `You are an expert AI consulting specialist. Based on the following discovery questionnaire responses (including some dynamically generated follow-up questions specific to this respondent), create a personalized, professional consulting offering.

RESPONSES:
${JSON.stringify(answers, null, 2)}

Respond with two clearly separated parts, using EXACTLY this format so it can be parsed programmatically:

===SITUATION ANALYSIS===
(2-3 sentences summarizing their specific situation and challenges, referencing details they actually gave. This part is shown to the respondent for free, before any payment, so it must stand alone and feel valuable on its own — but must not include the recommendations, roadmap, or pricing.)

===FULL PLAN===
(Everything else, in clean markdown with headers and bullets:
1. THREE RECOMMENDED SOLUTIONS, ranked by priority for THEM specifically. For each: name, why it fits their situation, expected outcome, rough timeline, effort level (Low/Medium/High).
2. IMPLEMENTATION ROADMAP — Phase 1 (0-4 weeks, quick wins), Phase 2 (4-8 weeks), Phase 3 (8-12 weeks).
3. INVESTMENT & ROI — cost range appropriate to their stated budget tier, expected ROI signals, metrics to track.
4. NEXT STEPS — what to cover in the consultation call.)

Be specific to what they actually said — avoid generic filler. Use the exact "===SITUATION ANALYSIS===" and "===FULL PLAN===" markers shown above, with nothing else on those marker lines.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';

    const situationMarker = '===SITUATION ANALYSIS===';
    const planMarker = '===FULL PLAN===';
    const situationStart = rawText.indexOf(situationMarker);
    const planStart = rawText.indexOf(planMarker);

    let situationAnalysis;
    let fullPlan;

    if (situationStart !== -1 && planStart !== -1 && planStart > situationStart) {
      situationAnalysis = rawText.slice(situationStart + situationMarker.length, planStart).trim();
      fullPlan = rawText.slice(planStart + planMarker.length).trim();
    } else {
      // Model didn't follow the marker format — fall back to showing
      // everything as the full plan with a generic free teaser, rather
      // than failing the request outright.
      situationAnalysis = "Here's a quick look at your situation based on what you shared — unlock your full plan below for the detailed recommendations, roadmap, and investment guidance.";
      fullPlan = rawText.trim();
    }

    return Response.json({
      situationAnalysis,
      fullPlan,
      generatedAt: new Date().toLocaleDateString(),
    });
  } catch (err) {
    console.error('generate-offering error:', err);
    return Response.json({ error: 'Failed to generate offering' }, { status: 500 });
  }
}
