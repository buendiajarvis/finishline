# FinishLine Platform

Internal platform for **FinishLine** — AI-transformation consulting for CEOs & business owners.
Two surfaces in one Next.js 16 app:

1. **Daily Content Engine** — AI-adoption news → CEO/owner briefings (framed around bottom-line
   impact) → repurposed outbound content.
2. **Internal CRM + Managed-Agent Lead-Gen** — a contact pipeline (ported from the RealtorCite CRM)
   plus a Claude web-search agent that finds businesses ripe for AI transformation.

Modeled on `/Users/phil/projects/RealtorCite/app`. See `BUILD.md` for the architecture.

## Quick start

```bash
cd finishline/platform
cp .env.local.example .env.local     # add ANTHROPIC_API_KEY at minimum
npm install
npm run dev                          # http://localhost:3000
```

Routes:
- `/` — marketing landing (CEO/owner altitude)
- `/signals` — published AI Signals briefings · `/signals/<date>` — one issue
- `/feed.xml` — RSS of issues
- `/contact` — request-a-briefing form (→ CRM as an inbound lead)
- `/crm` — internal CRM + lead-gen console (token-gated; set `CRM_TOKEN`)

## Daily content engine

```bash
# Generate today's briefing (agent researches the web for the week's AI-adoption stories)
npm run signals

# …or feed it your own curated headlines
npm run signals -- --date=2026-06-09 --input=./my-headlines.json --count=6

# Repurpose an issue into outbound assets (LinkedIn post, cold email, subject lines)
npm run outbound -- --date=2026-06-09
# → content/outbound/2026-06-09.md
```

Issues are written to `content/signals/<date>.json` and render automatically on the site.
Wire `npm run signals` to a daily cron for a true "daily" engine.

## Managed-agent lead-gen

Two ways to run the agent that sources AI-transformation-ready businesses:

```bash
# CLI → prospects.csv (then Import CSV in /crm, or it's cron-friendly)
npm run leads -- --segments="dental practices|regional law firms" --location="Austin, TX" --count=8
```

…or click **✦ Find leads** inside `/crm` (it runs the same agent and drops leads straight into the
pipeline via `POST /api/leadgen`).

## Outbound (send safety)

Sending is **dry-run by default** everywhere. The CRM → "Export send list" writes `send-list.md`;
review it, then:

```bash
npm run send-emails              # preview only
npm run send-emails -- --send    # actually send (needs RESEND_API_KEY + verified LEAD_FROM_EMAIL)
```

Every cold email carries a CAN-SPAM footer (postal address + HMAC unsubscribe + List-Unsubscribe
header); the suppression list is honored on every path.

## Environment

Only `ANTHROPIC_API_KEY` is required for the AI features (content engine, lead-gen, drafting).
`RESEND_API_KEY` enables sending; `CRM_TOKEN` gates the internal tools; `DATABASE_URL` (Postgres)
provides durability on Vercel's read-only filesystem. Full list in `.env.local.example`.

## Deploy

```bash
npx vercel --prod        # set CRM_TOKEN + DATABASE_URL in the Vercel project first
```

The existing static marketing site in `finishline/` is untouched; this app is a separate deploy.
