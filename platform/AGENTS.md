# Operating notes (for humans and coding agents)

## What this is
A Next.js 16 (App Router) app at `finishline/platform/`. Two surfaces: a daily AI-Signals content
engine and an internal CRM + managed-agent lead-gen. Stack mirrors `RealtorCite/app`: React 19,
Tailwind 4, shadcn, Vercel AI SDK (`ai` v6) with `@ai-sdk/anthropic`, Resend, optional Postgres.

## Hard invariants — do not break
1. **Send is dry-run by default.** `/api/crm` `send` and `scripts/send-cold-emails.mjs` never send
   unless `dryRun:false` / `--send`. Keep that gate.
2. **Suppression is always honored** before any send; every cold email keeps its CAN-SPAM footer
   (postal address + HMAC unsubscribe + `List-Unsubscribe`).
3. **CRM fails closed in prod**: `/api/crm` and `/api/leadgen` return 503 when `CRM_TOKEN` is unset
   in production.
4. **AI degrades gracefully**: with no `ANTHROPIC_API_KEY`, drafting falls back to a template and
   the lead-gen agent returns an explanatory note instead of throwing.

## Persistence
Local-first JSON (`data/crm.json`, `data/leads.jsonl`, `data/unsubscribed.json`, `data/sent-log.jsonl`)
falling back to Postgres (`DATABASE_URL`) for durability on Vercel's read-only FS. CRM = a single
JSONB blob (`crm_store`); leads = an append-only table. See `lib/db.ts`.

## Where things live
- Content engine: `lib/signals.ts` (read), `scripts/generate-signals.mjs` (write),
  `scripts/build-outbound.mjs`, pages under `app/signals/`, `content/signals/*.json`.
- CRM: `lib/crm.ts`, `app/api/crm/route.ts`, `app/crm/`.
- Outreach: `lib/outreach.ts`, `lib/suppression.ts`, `scripts/send-cold-emails.mjs`. Cold-draft
  generation grounds itself in the prospect's website via `lib/company-context.ts` (domain derived
  from the contact's email, or an explicit `website`; free-mail domains skipped; cached + best-effort).
- Lead-gen agent: `lib/leadgen.ts` (+ `app/api/leadgen/route.ts`) and the standalone
  `scripts/find-leads.mjs`. Both use Claude + the `web_search` tool, two-pass (research → structure).
- Inbound: `lib/leads.ts`, `app/api/lead/route.ts` (contact form).
- Model IDs: `lib/ai.ts` (env-overridable). Brand tokens: `app/globals.css`.

## Cadence
There is no cron yet. Operate as a batch: `npm run signals` daily (or cron it), `npm run leads`
to source prospects, draft + review in `/crm`, export send-list, `npm run send-emails -- --send`.
