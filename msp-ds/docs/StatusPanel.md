---
category: Actions
---

StatusPanel — Sunken side panel listing status rows, each with a square live/standby indicator.

## Usage

```tsx
<StatusPanel
  header="System status"
  rows={[
    { label: "Helpdesk — accepting tickets", state: "live" },
    { label: "Monitoring — all sites green", state: "live" },
    { label: "Onsite dispatch — standby", state: "standby" },
  ]}
/>
```

## Notes

Designed for the `aside` slot of a CtaSection, where it spans the right four columns.
