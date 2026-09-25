---
category: Foundations
---

AppShell — Root wrapper that establishes the design system's ground — dark navy surface, base text colour, Hanken Grotesk, and `color-scheme: dark`.

## Usage

```tsx
<AppShell fullHeight>
  <SiteNav brand="FinishLine" cta={{ label: "Submit a ticket", href: "#ticket" }} />
  <Hero title="Your IT, handled." subtitle="Monitoring, security, helpdesk, and cloud." />
  <SiteFooter brand="FinishLine" location="Serving the Bay Area" />
</AppShell>
```

## Notes

**Wrap every screen in this.** The system has no light mode: without it, the light `--on-surface` text lands on the browser's white default and is effectively invisible. Skip it only when the host page already paints `--background` itself.
