# design-sync notes — finishline-msp-ds

## What this package is

`finishline-msp-ds` is **not** a pre-existing library that happened to be lying around. It was
built during the first design-sync run (2026-08-07) by extracting the design language from the
**live** finishlinemsp.com and reimplementing it as a typed React package with a real
tsup build (`dist/index.js` + `dist/index.d.ts`).

Provenance, so a future run can re-derive it:

- `https://finishlinemsp.com/` serves `finishline/index.html` **byte-for-byte** (sha1 `d4678074…`).
- `https://finishlinemsp.com/msp` serves `finishline/msp/contact/index.html` (sha1 `f0e8681e…`).
- Both pages carry their CSS in an inline `<style>` block. `src/styles.css` is those two
  stylesheets merged and deduped. There is no build step between the site and this package —
  if the site's CSS changes, re-scrape and re-merge by hand.
- The Next.js app at `finishline/platform/` shares the same brand tokens but is a **different**
  deployment surface. It is not what finishlinemsp.com serves. Do not treat it as the source.

## Deliberate deviations from the live CSS

These are intentional. Do not "fix" them back without reading why.

- `.hero-video` / `.hero-video-overlay` are `position: absolute`, not `fixed`. Fixed positioning
  escapes any bounded container, so in a preview card (and in most designs the agent builds) a
  fixed video covers the whole viewport. Absolute keeps it inside the hero.
- `.indicator` was promoted from a descendant selector (`.cta-panel-row .indicator`) to a
  top-level class, so `Indicator` works anywhere. The `live` / `standby` modifiers came with it.
- Added composability hooks the site did not need because it was hand-written HTML:
  `.grid-12`, `.section-sunken`, `.nav-static`, `.hero-actions`, `.cta-button.ghost`,
  `.cta-button.quiet`, `.chatbot-panel.docked`, `.hero-title .glow`.
- Dropped the contact page's `body { display: flex; flex-direction: column; min-height: 100vh }`
  and `.contact { flex: 1 0 auto }`. That is page-shell layout, not design-system vocabulary,
  and it fights any layout the design agent builds.
- Merged form conflicts: base `.form-textarea` keeps the homepage's `min-height: 100px`;
  `.contact-form .form-textarea` restores the contact page's `120px`. `.form-thanks` keeps the
  homepage's panel chrome; `.contact-panel .form-thanks` drops it, as on the contact page.

## Fonts

Hanken Grotesk + JetBrains Mono are **self-hosted** in `fonts/` (4 woff2 files, latin +
latin-ext only, ~97KB total). The live site loads them from Google Fonts over the network;
shipping them locally means designs built with this DS never render in a fallback face and never
depend on an external host. `fonts/fonts.css` is generated — to regenerate, re-fetch the Google
CSS with a browser User-Agent (the API serves woff2 only to browser UAs), keep the `latin` and
`latin-ext` blocks, download each unique `url()`, and rewrite the urls to `./<file>.woff2`.

Both families are variable fonts, so one file per subset covers every shipped weight
(400/500/600/700/800 display, 400/500 mono).

## Environment gotchas

- This machine's Python has no working SSL trust store — `urllib` fails with
  `CERTIFICATE_VERIFY_FAILED`. Do all network fetching with `curl`; use Python only for parsing.
- `while read` over a file with no trailing newline silently skips the last row. `printf '\n' >>`
  the file first, or a font download goes missing without an error.
- The repo root `/Users/phil/projects/FinishLine` is **not** a git repo. The git root is
  `finishline/`. Workspace-bounded config paths (`extraFonts`) resolve against that.

## Known render warns

_(none recorded yet — first run)_

## Re-sync risks

- **`src/styles.css` is a hand-merge of two scraped stylesheets.** Nothing detects drift if the
  live site's CSS changes. Re-scrape both pages and diff before trusting a re-sync.
- **The site could move off static HTML.** If finishlinemsp.com starts serving the Next.js app at
  `finishline/platform/`, this package's provenance is stale and the whole extraction should be
  redone from the new source.
- **`finishline` Vercel project billing.** The site returned `402 DEPLOYMENT_DISABLED` at the
  start of this run. If a re-sync needs to re-scrape and gets a 402, that is billing, not a
  code problem — the local `finishline/index.html` and `finishline/msp/contact/index.html` are
  byte-identical fallbacks.
- **Component set is curated, not exhaustive.** The chat widget's upload/gate sub-states
  (`.chatbot-upload`, `.chatbot-gate`, `.chatbot-file-btn`, `.chatbot-source-pane`) have CSS in
  `styles.css` but no React component — they were interaction-only states on the live site.
  Adding them later is additive and safe.

---

## Run log — 2026-08-07 (first sync)

### The one global fix that mattered

Preview cards are scaffolded with a hard-coded `body{background:#fff}` in `lib/emit.mjs`, which
loads **after** `styles.css`. On a dark-only DS that means every card renders light-on-white and
looks broken. `lib/emit.mjs` defines the output contract and must not be forked. The fix was to
add an `AppShell` root wrapper to the package and set it as `cfg.provider` — every preview is
then wrapped in a div that repaints `--background`.

That wrapper was worth adding on its own merits: the design agent needs the same thing when it
mounts this DS inside a host page. It is documented as required in `conventions.md`.

Symptom to recognise on a future run: cards where panels look fine but loose text looks washed
out. Verify with a computed-style probe before assuming a colour bug — the text colour was
correct (`rgb(220,225,251)`); only the ground was wrong.

### Other fixes applied

- `docsDir: "docs"` — without it all 42 components landed in a single `general` group and every
  `.prompt.md` was synthesized. `docs/*.md` frontmatter `category` drives the 8 groups.
  Docs are generated by `.design-sync/gen-docs.mjs` — **edit that script, not `docs/`**, and
  re-run it after adding a component.
- `guidelinesGlob: ["guides/**/*.md"]` — the default glob includes `docs/*.md`, which swept all
  42 per-component docs into `guidelines/` as duplicates.
- `overrides.<Name>.cardMode = "column"` on the 13 components whose stories are wider than a
  product grid cell (every page-section and layout component, plus the card components).
- Interfaces that redefine `title` as `ReactNode` must extend
  `Omit<React.HTMLAttributes<T>, "title">` — the HTML `title` attribute is `string` and tsup's
  dts build fails on the conflict. Seven interfaces needed it.

### Known render warns

None outstanding. Final validate: 42/42 render cleanly, 0 bad, 0 thin, 0 variantsIdentical,
0 floor cards. The 13 `[GRID_OVERFLOW]` warns were resolved by the `cardMode` overrides above;
`column` cards cannot re-flag `wide` by construction, so they should not reappear.

`FormHoneypot` is invisible by design (positioned 5000px off-screen). Its preview deliberately
renders the surrounding form plus a revealed copy so the card is not empty. If a future run sees
a blank-ish honeypot card, that is expected, not a regression.

### Re-sync cost

Final `package-capture.mjs` printed **42 carried forward, 0 grade cleared** — grades are stable
and a re-sync with no source change should re-verify nothing.
