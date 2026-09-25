---
category: Foundations
---

Indicator — Static 6px status square — `live` glows cyan, `standby` is inert grey.

## Usage

```tsx
<div className="cta-panel-row">
  <Indicator state="live" />
  Helpdesk — accepting tickets
</div>
```

## Notes

The vocabulary StatusPanel and ContactPoint use. Unlike PulseDot it does not animate.
