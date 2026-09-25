---
category: Contact
---

ContactPanel — Bordered panel on the sunken surface that holds the ticket form. Spans the right six columns of a ContactLayout.

## Usage

```tsx
<ContactPanel header="Submit a ticket">
  <Form onSubmit={handleSubmit}>
    <FormField label="Name" htmlFor="name"><FormInput id="name" /></FormField>
    <FormSubmit>Submit ticket</FormSubmit>
  </Form>
</ContactPanel>
```
