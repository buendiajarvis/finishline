# Preassessment Diagnostic Paywall + Industry Generalization

Date: 2026-07-13
Status: Approved
Supersedes the earlier "validation" queue position — this is now the next sub-project after design coherence.

## Problem

Preassessment currently: (1) asks a free multi-section questionnaire scoped to sports/recreation orgs (swim teams, membership clubs), (2) generates a full AI offering (situation analysis, 3 ranked recommendations, roadmap, ROI) and shows it entirely free, (3) only monetizes at the very end via a 3-tier consultation-booking picker ($49/$199/$399).

Two changes:
1. **Generalize the questionnaire** to any industry/business type — not just sports/recreation orgs.
2. **Move the paywall earlier**: the full generated plan (recommendations, roadmap, ROI, next steps) becomes paid. Only a short free teaser (situation analysis) is shown before the paywall. Replace the 3-tier package picker with a single flat diagnostic fee, explicitly credited toward implementation if the prospect proceeds.

Copy constraints (from the pattern this is modeled on, generalized — not copying any specific company's branding or exact wording):
- Never describe the fee as a "consulting fee" — frame it as unlocking "your plan" / "your diagnostic."
- Never use sales-pitch language on the CTA or surrounding copy ("close the sale," "buy now," "limited time," "act now"). Frame the CTA as a practical next step ("Unlock Your Plan," "See the Full Plan").
- State plainly that the fee is credited toward implementation if they move forward — this is a real commitment, not a dark pattern, so it must be accurate and unambiguous.

## Approach

Three independent changes, each touching a distinct layer of the app, done as one cohesive sub-project since they interlock (the questionnaire feeds the offering; the offering's structure determines what's teaser vs. paywalled; the paywall replaces the existing checkout picker):

1. `lib/questions.js` — rewrite labels/options to be industry-agnostic. Keep the same structure (sections, branching via `showIf`) since that mechanism already works and isn't industry-specific — only the words inside are.
2. `app/api/generate-offering/route.js` — no change to the generation call itself (the AI prompt is already generic-ish, referencing "consulting offering" not sports-specific terms); the split between free/paid content happens client-side in Task 3, by only rendering the situation-analysis portion until payment, since the API already returns the full markdown in one response. (Considered: splitting into two API calls, one for the free teaser and one for the full plan gated server-side. Rejected — the free/paid split is a display concern, and the full content already comes back in one Anthropic call; two calls would double AI cost for a static teaser we can slice client-side. This means the full plan text technically arrives in the client bundle before payment, so a technically savvy user could inspect network responses to see it early. Accepted as low-risk for this MVP — the target audience isn't going to reverse-engineer devtools, and the alternative doubles cost for every visitor including non-payers.)
3. `app/page.js`'s `OfferingScreen` — parse the returned markdown into "situation analysis" (shown free) vs. everything else (blurred/truncated behind a paywall card). Replace the 3-tile package grid with a single flat-fee CTA card.
4. `app/api/create-checkout-session/route.js` — replace the 3-entry `PACKAGES` map with a single `DIAGNOSTIC` fee product.

## Design

### 1. Question rewrite — `lib/questions.js`

Replace org-specific wording with industry-neutral equivalents, preserving every question `id`, `type`, `required`, and `showIf` condition exactly (so `app/page.js`, `app/api/next-question`, and `app/api/generate-offering` — none of which hardcode question text — keep working unchanged):

- `orgType` options become business-model categories usable by any industry: "Product-based (e.g. retail, e-commerce)", "Service-based (e.g. agency, consulting, trades)", "Membership/subscription-based", "Mixed / Other".
- `orgSize` label changes from "members/participants" to "customers/clients."
- `challenges` checkbox options generalize "Member retention & engagement" → "Customer retention & engagement", keeps the rest (scheduling, billing, admin, communication are already generic).
- The two branching textareas (`meetSchedulingDetail`, `classCapacityDetail`) — currently gated on `competitive`/`recreation` org types that no longer exist — get relabeled to match the new `orgType` values: one for product-based (inventory/fulfillment logistics), one for service-based (scheduling/capacity).
- `schedulingSystem`, `techComfort`, `systems`, `painPoint`, `aiExperience`, `budget`, `email`, `phone` — already industry-neutral, no change needed.

### 2. Offering screen split — `app/page.js`

The `OfferingScreen` component currently renders `offering.content` (the full markdown) in one `whitespace-pre-wrap` block. Change:

- Split `offering.content` client-side on the `## 2.` / "RECOMMENDED SOLUTIONS" heading (the API prompt's numbered sections are consistent enough to split on, but to make this robust regardless of exact AI phrasing, the API is changed to return two fields instead of one blob: `situationAnalysis` and `fullPlan`, split server-side in `generate-offering/route.js` by parsing the model's markdown headers before returning — deterministic and doesn't depend on client-side string matching against AI-variable text).
- Free section: situation analysis, shown in full, normal styling.
- Paywalled section: a card showing a blurred/truncated preview (CSS `filter: blur(4px)` over the first ~2 lines of the roadmap heading, non-interactive) with an overlay: headline ("Your Full Plan Is Ready"), one line explaining what's included (3 ranked recommendations, phased roadmap, investment guidance), the flat fee amount, the credited-toward-implementation line, and the CTA button.
- CTA button label: "Unlock Your Plan". No "Reserve"/"Book"/package language remains.

### 3. Single diagnostic fee — `create-checkout-session` + checkout screen

- `create-checkout-session/route.js`: replace `PACKAGES` map with one constant, e.g. `DIAGNOSTIC = { name: 'AI Readiness Diagnostic & Plan', amount: 75000 }` ($750, matches the reference order of magnitude — a real placeholder the user can tune later). `packageType` param removed from the request body entirely (no longer a choice); `selectPackage()` in `page.js` becomes a no-arg `unlockPlan()`.
- Stripe product name and line item description include the "credited toward implementation" language so it shows on the actual Stripe checkout page, matching what the app told the user before they got there — no bait-and-switch between what's promised and what Stripe charges.
- On successful payment + return to the app (or `/booking-confirmed`), the full plan (`fullPlan` field, already fetched) unblurs — no second API call needed since the content was already fetched, just gated by a client-side "unlocked" boolean set after checkout success. (Booking-confirmed page already exists as the Stripe `success_url` target; no change needed there for this sub-project.)

### Copy checklist (must hold across every string added in this sub-project)

- No instance of "consulting fee," "sale," "sales," "deal," "buy now," "act now," "limited time."
- Every mention of the fee states, in the same breath or immediately adjacent, that it is credited toward implementation if the prospect proceeds.
- CTA button text is an action on the plan itself ("Unlock Your Plan"), not a payment verb ("Buy," "Purchase," "Checkout").

### Testing

Manual only, consistent with the rest of this app: `npm run dev`, walk through the full questionnaire with generic-industry answers (e.g. select "Service-based"), confirm situation analysis renders free and the rest is visibly blurred/gated, confirm the flat-fee CTA reads correctly, confirm Stripe test checkout shows the $750 diagnostic line item with the credited-toward-implementation description, confirm post-payment the full plan unblurs.

## Out of scope

DB persistence, email automation, calendar integration, analytics — unchanged from the original build-sequence, still pending as separate sub-projects. Validation (required-field enforcement) also still pending, now reordered after this sub-project per the user's redirect.
