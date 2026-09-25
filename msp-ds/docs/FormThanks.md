---
category: Forms
---

FormThanks — Post-submit confirmation state — centred glyph, heading, and copy.

## Usage

```tsx
<FormThanks
  title="Ticket received"
  desc="An engineer has been paged and will contact you within 15 minutes."
  visible={submitted}
/>
```

## Notes

Renders its own panel chrome unless it sits inside a ContactPanel, where it drops the border and background. Hidden unless `visible`.
