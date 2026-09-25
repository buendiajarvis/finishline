import { FormHoneypot, Form, FormField, FormInput, FormSubmit, FormNote } from "finishline-msp-ds";

/**
 * The honeypot renders nothing visible by design — it is positioned 5000px
 * off-screen. This cell shows the form it belongs to so the card is not empty;
 * the honeypot itself is the invisible field between the input and the button.
 */
export const InAForm = () => (
  <Form>
    <FormField label="Work email" htmlFor="hp-email">
      <FormInput id="hp-email" type="email" placeholder="jane@northwind.com" />
    </FormField>
    <FormHoneypot />
    <FormSubmit>Submit ticket</FormSubmit>
    <FormNote>
      An off-screen honeypot field sits above this button. Real users never see or tab into it;
      a submission that fills it is dropped.
    </FormNote>
  </Form>
);

/** Made visible for inspection by overriding the off-screen positioning. */
export const RevealedForInspection = () => (
  <div>
    <FormNote>The same field with its off-screen positioning overridden:</FormNote>
    <div
      style={{ marginTop: 12, border: "1px dashed var(--outline)", padding: 16 }}
      // eslint-disable-next-line react/no-unknown-property
      ref={(el) => {
        const honey = el?.querySelector(".form-honey") as HTMLElement | null;
        if (honey) {
          honey.style.position = "static";
          honey.style.left = "auto";
          honey.style.opacity = "1";
          honey.style.height = "auto";
          honey.style.width = "auto";
          honey.style.overflow = "visible";
        }
      }}
    >
      <FormHoneypot />
    </div>
  </div>
);
