import { FormNote, Form, FormSubmit } from "finishline-msp-ds";

/** The fine print under a form. */
export const UnderAForm = () => (
  <Form>
    <FormSubmit>Submit ticket</FormSubmit>
    <FormNote>A real engineer responds in under 15 minutes.</FormNote>
  </Form>
);

/** The register these notes are written in. */
export const Examples = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <FormNote>A real engineer responds in under 15 minutes.</FormNote>
    <FormNote>We reply within one business day. No marketing, ever.</FormNote>
    <FormNote>Your details are used to answer this request and nothing else.</FormNote>
  </div>
);
