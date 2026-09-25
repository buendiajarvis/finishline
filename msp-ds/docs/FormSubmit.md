---
category: Forms
---

FormSubmit — Solid cyan submit button — uppercase mono, left-aligned in the stack, glows on hover, dims to half opacity when disabled.

## Usage

```tsx
<FormSubmit disabled={sending}>{sending ? "Sending…" : "Submit ticket"}</FormSubmit>
```

## Notes

Defaults to `type="submit"`. Use CtaButton instead when the action navigates rather than submits.
