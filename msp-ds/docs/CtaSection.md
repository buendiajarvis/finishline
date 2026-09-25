---
category: Page sections
---

CtaSection — Closing call-to-action band on the sunken background — copy and buttons on the left seven columns, an optional panel on the right four.

## Usage

```tsx
<CtaSection
  title="Something broken right now?"
  desc="Submit a ticket and a real engineer contacts you within 15 minutes. No phone tree, no ticket purgatory."
  actions={<CtaButton href="#ticket">Submit a ticket</CtaButton>}
  aside={
    <StatusPanel
      header="System status"
      rows={[
        { label: "Helpdesk — accepting tickets", state: "live" },
        { label: "Onsite dispatch — standby", state: "standby" },
      ]}
    />
  }
/>
```
