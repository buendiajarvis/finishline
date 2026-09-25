# FinishLine Platform — Build Plan

Internal platform for **FinishLine** (AI transformation consulting for CEOs & business owners).
Lives at `finishline/platform/` as a self-contained Next.js 16 app. The existing static
marketing site (`finishline/index.html`, `workshop/`) is untouched.

Modeled on the RealtorCite CRM (`/Users/phil/projects/RealtorCite/app`): same stack,
same local-JSON-first / Postgres-durable persistence, same dry-run-by-default send safety,
re-verticaled from real-estate GEO to AI-adoption consulting.

## Two product surfaces

### 1. Daily Content Engine  (public + repurposing)
News on AI adoption → CEO/owner briefings framed around **bottom-line impact** → outbound.

- `lib/signals.ts` — Issue/Story data model; read/write issues from `content/signals/*.json`.
- `lib/signals-generate.ts` — given raw news items, Claude writes the per-story
  "why this moves your P&L" angle + the issue hero; produces a structured Issue.
- `scripts/generate-signals.mjs` — daily CLI: takes headlines (file/CLI/seed), runs the
  generator, writes `content/signals/<date>.json`.
- `scripts/build-outbound.mjs` — repurpose an issue → outbound assets (cold-email angle,
  LinkedIn post, subject lines) via Claude, written to `content/outbound/<date>.md`.
- `app/signals/page.tsx` + `app/signals/[date]/page.tsx` — public briefing pages, in the
  FinishLine "mission-control" dark aesthetic (port of `ai-signals-june-2026.html`).
- `app/feed.xml/route.ts` — RSS of issues.

### 2. Internal CRM + Managed-Agent Lead-Gen  (internal, token-gated)
Port of the RealtorCite Outbound CRM + a new agentic sourcing engine.

- `lib/crm.ts` — unified contact store. Stages re-verticaled for a consulting motion:
  `new → contacted → replied → call_booked → proposal → won → lost`.
  Sources: `outbound | inbound_assessment | inbound_contact`.
- `lib/outreach.ts` — Claude-drafted cold emails (FinishLine voice) + send-list export +
  Resend send. **Dry-run by default**, CAN-SPAM footer, HMAC unsubscribe.
- `lib/suppression.ts` — unsubscribe/suppression store (HMAC-signed links).
- `lib/leads.ts` + `app/api/lead/route.ts` — inbound capture (assessment / contact form),
  auto-sync into the CRM.
- `app/api/crm/route.ts` + `app/crm/` — token-gated CRM API + UI (import / draft / draft_all
  / export_send_list / send / add_contact / stage / notes).
- **`lib/leadgen.ts`** — the managed agent. Claude (`claude-sonnet-4-6`) + `web_search`
  tool finds real businesses in a target segment (industry × geo) that are **ripe for AI
  transformation**, scores readiness, and returns structured leads.
- `scripts/find-leads.mjs` — CLI: run the lead-gen agent over segments → `prospects.csv`
  (same alias-tolerant shape the CRM importer already parses).
- `app/api/leadgen/route.ts` — trigger a lead-gen run from the CRM UI.

## Shared foundation
- `lib/db.ts` — Postgres blob/append with JSON-file fallback (verbatim pattern).
- `lib/ai.ts` — central model IDs (env-overridable) + Anthropic client config.
- `lib/site.ts`, `lib/utils.ts` — site constants + `cn()`.
- `app/globals.css` — FinishLine dark tokens (Material-3 naming) wired into Tailwind 4 + shadcn.
- `app/layout.tsx` — Hanken Grotesk + JetBrains Mono via `next/font`.
- `components/` — Nav, Footer, Card, SectionLabel, PulseDot, StoryCard, ui primitives.

## Safety invariants (carried over, non-negotiable)
1. Outbound is **dry-run by default**; real sends require explicit `dryRun:false` / `--send`.
2. Suppression list honored on every send path; CAN-SPAM footer (postal addr + unsubscribe).
3. CRM API fails **closed** in production when `CRM_TOKEN` is unset (503).
4. AI features degrade gracefully (deterministic fallback) when `ANTHROPIC_API_KEY` is absent.
5. The lead-gen agent **verifies** candidates against real web sources before they enter the funnel.

## AI / env
- `ANTHROPIC_API_KEY` — the one required AI key (content engine, lead-gen, drafting).
- `RESEND_API_KEY`, `LEAD_FROM_EMAIL`, `LEAD_NOTIFY_EMAIL` — outbound + notifications.
- `CRM_TOKEN`, `UNSUBSCRIBE_SECRET` — internal gating.
- `DATABASE_URL` — optional Postgres durability (required on Vercel's read-only FS).
- `NEXT_PUBLIC_SITE_URL`.
