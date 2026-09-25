---
category: Cards
---

IntelCard — Telemetry tile — tag, oversized cyan metric, mono caption, and description on a sunken panel with a cyan corner pip.

## Usage

```tsx
<IntelCard
  tag="Response"
  metric="11"
  metricUnit="min"
  label="Median first touch"
  desc="Across every ticket opened this month."
/>

<IntelCard
  large
  tag="Ticket volume"
  metric="146"
  label="Last 30 days"
  desc="Resolved without an onsite visit."
  viz={<MetricBars active={[5, 7, 8]} />}
/>
```

## Notes

The `large` variant spans six columns and lays copy beside a visualization; pass that visualization as `viz`. The default variant spans four.
