---
category: Foundations
---

Grid12 — The 12-column grid every layout on the site is built on, with the system's 24px gutter.

## Usage

```tsx
<Grid12>
  <div style={{ gridColumn: "span 8" }}>Main</div>
  <div style={{ gridColumn: "span 4" }}>Aside</div>
</Grid12>
```

## Notes

Children set their own span via `gridColumn`. Components that already span (CapabilityCard, IntelCard) manage it themselves.
