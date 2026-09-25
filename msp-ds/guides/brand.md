# FinishLine MSP — "Mission Control"

The design language shipping on finishlinemsp.com. One accent, one dark surface family,
two typefaces, and a hard rule that anything reading as machine output gets set in mono.

## The idea

The site sells managed IT to businesses that cannot afford downtime. Everything in the
visual language pushes on *operational confidence*: telemetry readouts, status indicators,
square corners, hairline borders, and a single electric-cyan accent used sparingly enough
that it always means "live" or "act here". It should feel like a control room, not a brochure.

## Surfaces

Five stacked darks, lightest to darkest in use — never invent an intermediate value:

| Token | Use |
|---|---|
| `--background` / `--surface` `#0c1324` | The page. |
| `--surface-container-lowest` `#070d1f` | Sunken bands (`Section sunken`) and input fields. |
| `--surface-container-low` `#151b2d` | Every panel and card. |
| `--surface-container` `#191f31` | Raised chrome — bot chat bubbles. |
| `--surface-container-high/highest` | Reserved; unused on the live site today. |

Panels are `--surface-container-low` with a `1px solid var(--outline-variant)` border.
There is no elevation system and no shadow except the cyan glows below — depth comes from
the surface step and the hairline, nothing else.

## The accent

`--primary-container` `#00f0ff` is the only accent. `--surface-tint` `#00dbe9` is its slightly
duller sibling, used for uppercase mono labels so they sit behind the true accent.

Spend it on: the logo square, section labels, metrics, status indicators, CTA fills, focused
input borders, and the 2px corner pip on cards. Do not tint large areas with it — on this
palette a cyan panel reads as an error.

Glows are tokens, not ad-hoc shadows: `--glow-cyan` (subtle), `--glow-cyan-strong`
(button hover), `--glow-cyan-text` (headline accent words).

## Type

- **Hanken Grotesk** (`--ff-display`) — headlines and body prose.
- **JetBrains Mono** (`--ff-mono`) — every label, metric, status readout, button, nav item,
  and footer link.

The mono/prose split is the strongest signal in the system. If a string is a *label* rather
than a *sentence*, it is uppercase mono at 11–14px with `0.05em` tracking. Buttons are mono.
Navigation is mono. Body copy never is.

Display headlines run 48px desktop (`--fs-display-lg`), stepping to 36px at 1024px and 32px
at 640px through the token itself — do not hard-code hero sizes.

## Geometry

Square corners everywhere. There is no border-radius token because nothing in the system is
rounded. Indicators, logo marks, and card pips are small squares, not circles.

Spacing is a 4px scale, `--space-1` (4px) through `--space-24` (96px). Sections use 96px of
vertical padding; panels use 24–32px of internal padding; the grid gutter is 24px.

## Layout

A 12-column grid with a 24px gutter, capped at 1440px, with 64px page margins that shrink to
24px at 1024px and 20px at 640px. The standard column splits:

- Hero and CTA copy: `1 / 8`
- CTA aside panel: `9 / 13`
- Contact copy: `1 / 6`, contact form panel: `7 / 13`
- Service cards: `span 3` (four across) or `span 4` (three across)
- Intel cards: `span 4`, or `span 6` for the large variant

Everything collapses to full width at 1024px and stacks at 640px. The components handle this
themselves — do not add breakpoint overrides.

## Motion

Almost none, and all of it functional. Colour and border transitions are 0.15–0.2s ease.
The only animation in the system is `PulseDot`'s 2s opacity pulse, which is suppressed under
`prefers-reduced-motion`. Nothing slides, nothing bounces, nothing parallaxes.

## Voice

Short, direct, and specific. The live site promises numbers ("a real engineer contacts you
within 15 minutes", "24/7 monitoring", "flat monthly"), not adjectives. Labels are terse and
uppercase, often split with `//` — `MANAGED IT // ALWAYS ON`, `SECTION 01 // WHAT WE RUN FOR
YOU`. When writing filler copy for a layout, write in that register rather than lorem ipsum.
