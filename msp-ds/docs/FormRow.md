---
category: Forms
---

FormRow — Two-up field row that collapses to a single column below 640px.

## Usage

```tsx
<FormRow>
  <FormField label="Name" htmlFor="name"><FormInput id="name" /></FormField>
  <FormField label="Email" htmlFor="email"><FormInput id="email" type="email" /></FormField>
</FormRow>
```

## Notes

Give a child FormField the `full` prop to make it span both columns.
