---
category: Page sections
---

CapabilityGrid — Header row plus a 12-column grid for a set of CapabilityCards.

## Usage

```tsx
<Container>
  <CapabilityGrid
    headline="One team for everything with a power cord."
    body="Monitoring, security, helpdesk, and cloud — scoped in weeks, not quarters."
  >
    <CapabilityCard num="01" title="Helpdesk & support" desc="Real engineers, not a phone tree." span={3} />
    <CapabilityCard num="02" title="Network & infrastructure" desc="Monitored 24/7 and fixed before you notice." span={3} />
    <CapabilityCard num="03" title="Security & backup" desc="Endpoint protection, patching, and tested backups." span={3} />
    <CapabilityCard num="04" title="Cloud & Microsoft 365" desc="Email, identity, and SaaS managed end to end." span={3} />
  </CapabilityGrid>
</Container>
```
