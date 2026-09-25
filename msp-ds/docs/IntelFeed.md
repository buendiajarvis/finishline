---
category: Page sections
---

IntelFeed — Header plus a 12-column grid for IntelCards, with a live-status readout on the right.

## Usage

```tsx
<Container>
  <IntelFeed
    subtitle={<SectionLabel>Telemetry</SectionLabel>}
    title="What we are watching right now."
    status="LIVE // UPDATED 4 MIN AGO"
  >
    <IntelCard tag="Response" metric="11" metricUnit="min" label="Median first touch" desc="Across all tickets opened this month." />
    <IntelCard tag="Coverage" metric="24/7" label="Monitoring window" desc="Alerting routed to an on-call engineer, not a queue." />
    <IntelCard tag="Uptime" metric="99.98" metricUnit="%" label="Managed endpoints" desc="Rolling 90-day average across every managed site." />
  </IntelFeed>
</Container>
```
