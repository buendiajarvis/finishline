---
category: Forms
---

Form — Vertical form stack with the system's 20px rhythm. Wrap every field, row, and submit button in one of these.

## Usage

```tsx
<Form onSubmit={handleSubmit}>
  <FormRow>
    <FormField label="Name" htmlFor="name"><FormInput id="name" name="name" placeholder="Jane Okonkwo" /></FormField>
    <FormField label="Company" htmlFor="co"><FormInput id="co" name="company" placeholder="Northwind Dental" /></FormField>
  </FormRow>
  <FormField label="What's wrong?" htmlFor="detail" full>
    <FormTextarea id="detail" name="detail" placeholder="Server room is beeping and nobody can print." />
  </FormField>
  <FormHoneypot />
  <FormSubmit>Submit ticket</FormSubmit>
  <FormNote>A real engineer responds in under 15 minutes.</FormNote>
</Form>
```

## Notes

Also sets the 120px textarea minimum. Renders a real `<form>` — pass `onSubmit`, `action`, and `method` as usual.
