// app/api/next-question/route.js
//
// After a section's base (rule-based) questions are answered, the frontend
// calls this route to get 1-2 AI-generated follow-up questions that dig
// into whatever the respondent actually said — this is what makes the
// assessment feel custom-tailored rather than a static form.
//
// Falls back to returning an empty list (no follow-ups) if the API call
// fails, so the flow never blocks on this being unavailable.

export async function POST(request) {
  try {
    const { sectionTitle, answersSoFar } = await request.json();

    const prompt = `You are helping run an adaptive discovery questionnaire for an AI/automation consulting service. A respondent just completed the "${sectionTitle}" section with these answers:

${JSON.stringify(answersSoFar, null, 2)}

Generate 1-2 short, specific follow-up questions that dig deeper into what THIS respondent said — not generic questions. Only ask something if their answers reveal a genuine gap worth exploring; it's fine to return zero questions if their answers were already thorough.

Respond ONLY with valid JSON, no markdown fences, no preamble, in this exact shape:
{"questions": [{"id": "unique_snake_case_id", "label": "The question text", "type": "text"}]}

Use type "text" for short answers or "textarea" for longer ones. Keep labels under 20 words.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '{"questions": []}';
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return Response.json({ questions: parsed.questions || [] });
  } catch (err) {
    console.error('next-question error:', err);
    // Fail open — the form continues without dynamic follow-ups rather than breaking
    return Response.json({ questions: [] });
  }
}
