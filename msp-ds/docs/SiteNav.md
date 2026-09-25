---
category: Navigation
---

SiteNav — Glassmorphism site header — 56px tall, translucent navy with a 12px backdrop blur, a glowing logo square, uppercase mono links, and one solid cyan CTA.

## Usage

```tsx
<SiteNav
  brand="FinishLine"
  links={[
    { label: "Services", href: "#services" },
    { label: "Approach", href: "#approach" },
  ]}
  cta={{ label: "Submit a ticket", href: "#ticket" }}
/>
```

## Notes

Fixed to the viewport top by default. Pass `inFlow` to lay it out in normal flow — required inside cards, previews, or any bounded container. Links hide below 640px, as on the live site. Pages using the fixed nav need top padding to clear it (Hero and ContactLayout already include it).
