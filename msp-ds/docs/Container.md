---
category: Foundations
---

Container — Page-width wrapper — caps content at 1440px and applies the responsive side margins (64px desktop, 24px tablet, 20px mobile).

## Usage

```tsx
<Container>
  <SectionLabel>Section 01 // What we run for you</SectionLabel>
  <h2>One team for everything with a power cord.</h2>
</Container>
```

## Notes

Every full-width band on the site puts its content inside one of these. Section components that already render a `Container` (Hero, CtaSection, ContactLayout, SiteFooter) do not need another.
