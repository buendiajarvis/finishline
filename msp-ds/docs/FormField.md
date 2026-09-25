---
category: Forms
---

FormField — Label-over-control pairing — the only way fields are assembled on this site.

## Usage

```tsx
<FormField label="Urgency" htmlFor="urgency" full>
  <FormSelect id="urgency" name="urgency" defaultValue="normal">
    <option value="down">Everything is down</option>
    <option value="normal">Normal — needs fixing today</option>
    <option value="quote">Just a quote</option>
  </FormSelect>
</FormField>
```

## Notes

Pass `htmlFor` matching the control's `id` so the label is wired up. `full` spans both columns of a FormRow.
