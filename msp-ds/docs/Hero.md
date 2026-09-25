---
category: Page sections
---

Hero — Top-of-page hero — eyebrow, oversized display headline, supporting paragraph, and an action row on the left seven columns.

## Usage

```tsx
<Hero
  eyebrow="Managed IT // Always On"
  pulse
  title={<>Your IT, handled — <span className="glow">before it breaks.</span></>}
  subtitle="FinishLine is the managed IT partner for businesses that can't afford downtime. Monitoring, security, helpdesk, and cloud — one flat monthly fee, one team that owns the outcome."
  actions={
    <>
      <CtaButton href="#ticket">Submit a ticket</CtaButton>
      <CtaButton href="mailto:support@example.com" variant="quiet">Or email support →</CtaButton>
    </>
  }
/>
```

## Notes

Wrap accented words of `title` in a `<span>` to paint them cyan; add `className="glow"` for the cyan text-shadow. Pass `videoSrc` to run a darkened background video behind the copy — it is absolutely positioned, so it stays inside the hero.
