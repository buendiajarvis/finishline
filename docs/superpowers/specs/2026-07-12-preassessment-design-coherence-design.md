# Preassessment Design Coherence

Date: 2026-07-12
Status: Approved
Sub-project 1 of 6 in the preassessment full-build sequence (design coherence → validation → DB persistence → email → calendar → analytics).

## Problem

`preassessment/` (deployed at `preassessment.finishlinemsp.com`) is a Next.js app with intentionally minimal/unstyled UI (default Tailwind base, no custom theme). It needs to look like the same product as `finishlinemsp.com` (dark navy/cyan tech theme, defined inline in `index.html`), not a separate prototype.

This is styling-only. No changes to questionnaire logic (`lib/questions.js`), API routes, or Stripe flow.

## Approach

Copy design tokens from `index.html` into the preassessment app rather than extracting a shared CSS package. The two projects are separate deploys (static root site vs. Next.js app) and the token set changes rarely — a shared-package build step would be more setup than the problem justifies. Token drift risk is accepted; both are edited by the same team and the token source (`index.html`) is easy to diff against.

## Design

### 1. Token import — `preassessment/app/globals.css`

Append the `:root` custom-property block (lines 16-133 of `index.html`: surfaces, on-surface, primary/secondary/tertiary, outlines, typography scale, spacing scale, glow shadows) plus the Google Fonts `@import` for Hanken Grotesk + JetBrains Mono, and the base reset/body rules (lines 138-159). Keep Tailwind's `@tailwind base/components/utilities` directives above it so Tailwind utility classes still work alongside the custom properties.

### 2. Shared Nav + Footer — `preassessment/components/`

Two new components, ported from `index.html`'s `.nav`/`.nav-inner`/`.nav-brand`/`.nav-logo` and `.footer`/`.footer-inner`/`.footer-brand`/`.footer-links`/`.footer-location` markup and CSS:

- `Nav.js` — logo + "FinishLine" wordmark, wrapped in `<a href="https://finishlinemsp.com">`. No nav links (this is a focused single-flow app, not a marketing page) — just the brand mark, matching the "minimal header" fallback discussed but keeping full nav styling fidelity.
- `Footer.js` — same footer links and location string as the main site, for consistency.

Both imported into `app/layout.js` so they wrap every route (questionnaire, offering, booking-confirmed) without per-page duplication.

### 3. Recolor existing screens

`app/page.js` (questionnaire + offering screen, 308 lines) and `app/booking-confirmed/page.js`:

- Replace default/Tailwind-gray backgrounds and text with `var(--background)`, `var(--on-surface)`, `var(--surface-container)` etc.
- Primary CTAs (Continue, package selection, checkout buttons) get `--primary-container` background with `--glow-cyan` box-shadow, matching main site's cyan glow buttons.
- Headings use `--ff-display`; any data/label text (question numbers, price labels) uses `--ff-mono` per the main site's mono-for-data convention.
- Progress indicator / section dividers use `--outline-variant` and `--surface-container-high` borders.

No structural/layout changes beyond what's needed to hold the new classes — this is a palette and typography pass, not a rebuild.

### Testing

Manual only: `npm run dev` in `preassessment/`, walk through questionnaire → offering → checkout (Stripe test mode) → booking-confirmed, confirm no unstyled/default-Tailwind elements remain and nav/footer render on every screen.

## Out of scope (later sub-projects)

Validation, DB persistence, email automation, calendar integration, analytics — each gets its own spec.
