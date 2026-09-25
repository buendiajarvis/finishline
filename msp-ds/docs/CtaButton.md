---
category: Actions
---

CtaButton — The site's link button — uppercase mono, square corners, cyan glow on hover. Renders an anchor, since every call to action here navigates.

## Usage

```tsx
<CtaButton href="#ticket">Submit a ticket</CtaButton>
<CtaButton href="/msp" variant="ghost">See what we cover</CtaButton>
<CtaButton href="mailto:support@example.com" variant="quiet">Or email support →</CtaButton>
```

## Notes

`solid` is the cyan block, `ghost` the cyan outline, `quiet` the bare inline link the hero uses for its secondary action. For a real form submission use FormSubmit, which is a `<button>`.
