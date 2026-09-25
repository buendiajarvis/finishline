---
category: Page sections
---

ApproachTimeline — Horizontal process timeline — a hairline rule with a square cyan marker per phase, each carrying a mono index, title, and description.

## Usage

```tsx
<Container>
  <ApproachTimeline
    eyebrow={<SectionLabel>Section 02 // How it runs</SectionLabel>}
    title="Onboarding takes two weeks, not two quarters."
    phases={[
      { num: "Phase 01", title: "Audit", desc: "We inventory every device, licence, and vendor you are paying for." },
      { num: "Phase 02", title: "Stabilise", desc: "Patch, back up, and lock down whatever is on fire first.", active: true },
      { num: "Phase 03", title: "Monitor", desc: "Agents deployed, alerting wired to a human who answers." },
      { num: "Phase 04", title: "Improve", desc: "Quarterly roadmap so next year's IT costs less than this year's." },
    ]}
  />
</Container>
```

## Notes

Renders on the sunken background of its own. Four phases across is the site's shape; they drop to two-up at 1024px and stack at 640px. Mark the current phase `active` to light its marker.
