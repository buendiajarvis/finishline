# Preassessment — Adaptive AI Readiness Questionnaire

Deployed target: `preassessment.finishlinemsp.com`

## What's built

- **Adaptive questionnaire** (`lib/questions.js` + `app/page.js`)
  - Rule-based branching: some questions only appear based on prior answers
    (e.g. competitive vs. recreation orgs get different follow-ups)
  - AI-driven follow-ups: after each section, `/api/next-question` asks
    Claude to generate 1-2 questions tailored to what the respondent
    actually said, on top of the fixed question bank
- **Offering generation** (`/api/generate-offering`) — takes all answers
  (base + dynamic) and produces the situation analysis, three ranked
  recommendations, roadmap, and ROI section
- **Real Stripe Checkout** (`/api/create-checkout-session`) — three
  packages (Quick Call $49 / Deep Dive $199 / Strategy Session $399),
  prices defined server-side only
- **Stripe webhook** (`/api/webhook`) — verifies signature, logs
  `checkout.session.completed`. Has TODO markers for DB + email + calendar.

## Setup

```bash
npm install
cp .env.local.example .env.local
# fill in ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_PUBLIC_DOMAIN
npm run dev
```

Test Stripe webhooks locally with the Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/webhook
```

## Deploying to Vercel under the subdomain

1. `vercel` (or connect the repo in the Vercel dashboard) as its own project
2. Add all `.env.local` vars in Vercel → Settings → Environment Variables
3. In the same project: Settings → Domains → add `preassessment.finishlinemsp.com`
4. Add the CNAME record Vercel gives you wherever `finishlinemsp.com`'s DNS lives
5. In Stripe Dashboard → Developers → Webhooks, add
   `https://preassessment.finishlinemsp.com/api/webhook` listening for
   `checkout.session.completed`, copy the signing secret into
   `STRIPE_WEBHOOK_SECRET` on Vercel

## Known gaps / suggested next steps for Claude Code

This is a working scaffold, not a finished product. Things intentionally
left as TODOs:

1. **Persistence** — `/api/webhook` just `console.log`s the booking. Wire
   up a real database (Postgres/Supabase is a natural fit on Vercel) to
   store questionnaire answers + offering + booking status.
2. **Email automation** — send the offering + booking confirmation via
   email (e.g. Resend or Postgres-backed queue + SendGrid).
3. **Calendar integration** — auto-create a scheduling link (e.g. Cal.com
   embed) instead of the placeholder "we'll follow up" copy on the
   confirmation page.
4. **Visual polish** — the UI here is intentionally minimal/functional so
   the adaptive logic is easy to read. The earlier prototype had a more
   polished teal/emerald design with accordion sections — worth merging
   that styling into `app/page.js` and `OfferingScreen`.
5. **Validation** — required-field checks aren't enforced yet before
   "Continue" is clickable.
6. **Analytics** — track section drop-off, offering-view → payment
   conversion, per-package selection rates.

## Suggested prompt to give Claude Code CLI

> "This is a Next.js app for an adaptive AI-readiness questionnaire that
> generates a personalized consulting offer and takes payment via Stripe
> to reserve a consultation. Read through app/page.js, lib/questions.js,
> and the routes in app/api/. First get it running locally with `npm run
> dev` and confirm the flow works end to end with Stripe test mode. Then
> let's add [database persistence / email automation / calendar
> integration — pick one] before merging in the polished UI styling from
> [paste in the earlier artifact if you have it]."
