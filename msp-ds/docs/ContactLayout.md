---
category: Page sections
---

ContactLayout — The contact page's two-column shell — copy and promises on the left five columns, the form panel on the right six.

## Usage

```tsx
<ContactLayout
  title="Something broken? Tell us what's wrong."
  subtitle="Fill this out and a FinishLine engineer contacts you within 15 minutes."
  intro={
    <ContactPoints>
      <ContactPoint>A real engineer responds in under 15 minutes</ContactPoint>
      <ContactPoint>We triage remotely first, dispatch onsite if needed</ContactPoint>
      <ContactPoint>You get a direct line back to the person handling it</ContactPoint>
    </ContactPoints>
  }
  direct={<>Or email <a href="mailto:support@example.com">support@example.com</a></>}
  panel={<ContactPanel header="Submit a ticket">{/* Form goes here */}</ContactPanel>}
/>
```

## Notes

Renders a `<main>` and includes the top padding that clears the fixed SiteNav. Both columns go full width at 1024px.
