---
category: Foundations
---

PulseDot — The 6px cyan square that pulses on a 2s loop — the site's "system is live" signal.

## Usage

```tsx
<div className="hero-eyebrow">
  <PulseDot />
  Managed IT // Always On
</div>
```

## Notes

Honours `prefers-reduced-motion` by holding still. Hero and IntelFeed can render one for you via their `pulse` prop — reach for this directly only when composing a custom row.
