// app/api/webhook/route.js
//
// Stripe webhook — the reliable source of truth that payment succeeded.
// Never trust only the client-side redirect for this; Stripe recommends
// webhooks because redirects can be interrupted (closed tab, network drop).
//
// To test locally: `stripe listen --forward-to localhost:3000/api/webhook`
// In production: add this URL in the Stripe Dashboard -> Developers -> Webhooks
//   https://preassessment.finishlinemsp.com/api/webhook
// and select the `checkout.session.completed` event.

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // TODO: This is where you'd persist the booking to a database and
    // trigger a confirmation email / calendar invite. For now, this logs
    // it — replace with real persistence (e.g. a Postgres/Supabase insert,
    // or a call to your CRM).
    console.log('Booking confirmed:', {
      orgName: session.metadata?.orgName,
      packageType: session.metadata?.packageType,
      email: session.customer_email,
      amountTotal: session.amount_total,
      sessionId: session.id,
    });

    // Example next steps to implement:
    // await saveBookingToDatabase({ ...session });
    // await sendConfirmationEmail({ to: session.customer_email, ... });
    // await createCalendarInvite({ ... });
  }

  return Response.json({ received: true });
}
