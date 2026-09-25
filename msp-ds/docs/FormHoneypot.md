---
category: Forms
---

FormHoneypot — Off-screen honeypot field. Real users never see it; bots fill it, and the submit handler drops any payload where it is non-empty.

## Usage

```tsx
<Form onSubmit={handleSubmit}>
  {/* …real fields… */}
  <FormHoneypot />
  <FormSubmit>Submit ticket</FormSubmit>
</Form>
```

## Notes

Renders nothing visible — a preview card for it is intentionally near-empty. Read the field named by `name` (default `company_website`) in your submit handler and discard the submission if it has a value.
