---
category: Cards
---

MetricBars — Compact 120x80 bar visualization — bottom-aligned, dim cyan with selected bars lit.

## Usage

```tsx
<MetricBars values={[40, 55, 30, 70, 45, 85, 60, 95, 75, 50]} active={[5, 7, 8]} />
```

## Notes

Built for the `viz` slot of a large IntelCard. Ten bars is the site's default shape; `values` are percentage heights and `active` are the indices rendered at full cyan.
