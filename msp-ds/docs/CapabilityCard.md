---
category: Cards
---

CapabilityCard — Service tile — sunken panel, hairline border, a 2px cyan pip in the top-left corner, and a border that brightens on hover.

## Usage

```tsx
<CapabilityCard
  num="01"
  title="Helpdesk & support"
  desc="Real engineers, not a phone tree. Submit a ticket and get a human on it in minutes."
  span={3}
/>
```

## Notes

Defaults to `span={4}` (three per row). The four MSP service cards use `span={3}`. Cards reflow to two-up at 1024px and one-up at 640px on their own.
