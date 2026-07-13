// app/api/get-plan/route.js
//
// Reconstructs the paid plan text from a completed Stripe Checkout
// Session's metadata (chunked there at checkout-creation time — see
// /api/create-checkout-session). No database involved: the session
// itself is the record of what was purchased.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function reassembleChunks(prefix, metadata) {
  const count = parseInt(metadata[`${prefix}_count`] || '0', 10);
  let text = '';
  for (let i = 0; i < count; i++) {
    text += metadata[`${prefix}_${i}`] || '';
  }
  return text;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return Response.json({ error: 'Missing session_id' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Payment not completed' }, { status: 402 });
    }

    const metadata = session.metadata || {};
    const situationAnalysis = reassembleChunks('situation', metadata);
    const fullPlan = reassembleChunks('plan', metadata);

    return Response.json({
      orgName: metadata.orgName || '',
      situationAnalysis,
      fullPlan,
    });
  } catch (err) {
    console.error('get-plan error:', err);
    return Response.json({ error: 'Failed to retrieve plan' }, { status: 500 });
  }
}
