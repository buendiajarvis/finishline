import { FormSubmit, Form, FormNote } from "finishline-msp-ds";

/** Ready and in-flight — the only two states this button has. */
export const States = () => (
  <Form>
    <FormSubmit>Submit ticket</FormSubmit>
    <FormSubmit disabled>Sending…</FormSubmit>
    <FormNote>Disabled drops to half opacity and loses the hover glow.</FormNote>
  </Form>
);

/** Label lengths — the button hugs its content and stays left-aligned. */
export const Labels = () => (
  <Form>
    <FormSubmit>Send</FormSubmit>
    <FormSubmit>Submit ticket</FormSubmit>
    <FormSubmit>Request a callback within 15 minutes</FormSubmit>
  </Form>
);
