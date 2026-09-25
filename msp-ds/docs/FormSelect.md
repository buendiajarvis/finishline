---
category: Forms
---

FormSelect — Select styled to match the text input, with the system's own grey caret drawn in the right margin.

## Usage

```tsx
<FormSelect id="type" name="type" defaultValue="support">
  <option value="new">New service</option>
  <option value="support">Technical support</option>
  <option value="quote">Request a quote</option>
</FormSelect>
```

## Notes

Native chrome is suppressed via `appearance: none`; the caret is an inline SVG background.
