## Wrapping — read this first

**This system is dark-only and has no light mode.** Wrap every screen in `AppShell`, which
paints `--background`, sets `--on-surface` text, Hanken Grotesk, and `color-scheme: dark`.
Without it, the light body text lands on the browser's white default and is unreadable.

```jsx
<AppShell fullHeight>
  <SiteNav brand="FinishLine" cta={{ label: "Submit a ticket", href: "#ticket" }} />
  {/* page content */}
  <SiteFooter brand="FinishLine" location="Serving the Bay Area" />
</AppShell>
```

`SiteNav` and `ChatLauncher`/`ChatPanel` are `position: fixed` by default. Inside any bounded
container — a card, a preview, a split pane — pass `inFlow` (nav) or `docked` (chat panel), or
they escape to the viewport corners.

## Styling idiom — plain CSS classes plus CSS variables

There is **no utility framework and no styling props**. Components carry their own classes; for
your own layout glue, write plain CSS using the tokens below. Never invent colour, spacing, or
radius values — every one you need is a `var(--*)`.

**Surfaces** (darkest to lightest): `--surface-container-lowest` `#070d1f` (sunken bands, input
fields) · `--surface-container-low` `#151b2d` (every panel and card) · `--surface-container`
`#191f31` · `--background` / `--surface` `#0c1324` (the page).
Panels are `--surface-container-low` with `1px solid var(--outline-variant)`. **No shadows and
no border-radius exist in this system** — square corners everywhere, depth from surface steps.

**Text**: `--on-surface` `#dce1fb` (primary) · `--on-surface-variant` `#b9cacb` (secondary) ·
`--outline` `#849495` (placeholders, fine print).

**Accent**: `--primary-container` `#00f0ff` is the only accent — logo square, metrics, CTA fills,
focused borders, status indicators. `--surface-tint` `#00dbe9` is its duller sibling for
uppercase mono labels. `--on-primary` `#00363a` is text on a cyan fill. Do not tint large areas
cyan. Glows are tokens: `--glow-cyan`, `--glow-cyan-strong`, `--glow-cyan-text`.

**Type**: `--ff-display` (Hanken Grotesk) for headlines and prose; `--ff-mono` (JetBrains Mono)
for **every** label, metric, button, nav item, and status readout. If a string is a label rather
than a sentence, it is uppercase mono, 11–14px, `letter-spacing: var(--ls-mono-label)` (0.05em).
This mono/prose split is the strongest signal in the system. Sizes: `--fs-display-lg` (48px,
steps down responsively), `--fs-headline-md` (24px), `--fs-body-md` (16px), `--fs-mono-label`
(12px), `--fs-mono-data` (14px).

**Spacing**: 4px scale, `--space-1` … `--space-24` (4→96px). Grid gutter `--gutter` (24px),
page margin `--margin-desktop` (64px), max width `--container-max` (1440px).

**Useful classes you may apply directly**: `.container`, `.section` / `.section-sunken`,
`.grid-12`, `.section-label`, `.mono-data`, `.panel-divider`, `.cap-grid`, `.intel-grid`,
`.hero-actions`, `.cta-panel-row`, `.chatbot-source-tabs`. Modifier classes used by props:
`.active`, `.live`, `.standby`, `.full`, `.visible`, `.large`, `.ghost`, `.quiet`, `.glow`.

## Where the truth lives

Read `_ds/<folder>/styles.css` and its `@import` closure (`fonts/fonts.css` for the self-hosted
brand faces, `_ds_bundle.css` for every token and component rule) before styling anything.
`guidelines/guides/brand.md` covers the design rationale — surfaces, accent discipline, geometry,
motion, and the copy voice. Per-component API and examples are in each
`components/<group>/<Name>/<Name>.prompt.md`.

## Building with it

Prefer a library component over hand-rolled markup; use the tokens for your own glue.

```jsx
<AppShell fullHeight>
  <SiteNav inFlow brand="FinishLine" cta={{ label: "Submit a ticket", href: "#ticket" }} />
  <Hero
    eyebrow="Managed IT // Always On"
    pulse
    title={<>Your IT, handled — <span className="glow">before it breaks.</span></>}
    subtitle="Monitoring, security, helpdesk, and cloud — one flat monthly fee."
    actions={<CtaButton href="#ticket">Submit a ticket</CtaButton>}
  />
  <Section>
    <Container>
      <SectionLabel>Section 01 // What we run for you</SectionLabel>
      <div className="cap-grid" style={{ marginTop: "var(--space-10)" }}>
        <CapabilityCard num="01" title="Helpdesk & support" desc="A human on it in minutes." span={3} />
        <CapabilityCard num="02" title="Network" desc="Monitored 24/7." span={3} />
      </div>
    </Container>
  </Section>
  <SiteFooter brand="FinishLine" location="Serving the Bay Area" />
</AppShell>
```

Copy voice: short, direct, specific. The brand promises numbers ("within 15 minutes", "24/7",
"flat monthly"), not adjectives. Labels are terse and uppercase, often split with `//`. Write
filler copy in that register rather than lorem ipsum.
