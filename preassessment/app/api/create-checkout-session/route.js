// app/api/create-checkout-session/route.js
//
// Creates a real Stripe Checkout Session and returns its URL for redirect.
// The diagnostic fee is defined server-side only — never trust a price
// sent from the client.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DIAGNOSTIC = {
  name: 'AI Readiness Diagnostic & Plan',
  description: 'Full diagnostic, ranked recommendations, and implementation roadmap. Credited in full toward implementation if you move forward.',
  amount: 75000,
};

export async function POST(request) {
  try {
    const { orgName, email } = await request.json();

    const domain = process.env.NEXT_PUBLIC_DOMAIN || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${DIAGNOSTIC.name} — ${orgName || 'Assessment'}`,
              description: DIAGNOSTIC.description,
            },
            unit_amount: DIAGNOSTIC.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${domain}/booking-confirmed?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/`,
      customer_email: email || undefined,
      metadata: {
        orgName: orgName || '',
      },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error('create-checkout-session error:', err);
    return Response.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
