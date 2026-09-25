import { FormThanks, ContactPanel } from "finishline-msp-ds";

/** The standalone confirmation, with its own panel chrome. */
export const Standalone = () => (
  <FormThanks
    title="Ticket received"
    desc="An engineer has been paged and will contact you within 15 minutes. Check your email for the ticket number."
  />
);

/** Inside a ContactPanel, where it drops the border and background. */
export const InsideAPanel = () => (
  <ContactPanel header="Submit a ticket">
    <FormThanks
      title="Request received"
      desc="We'll respond within one business day."
    />
  </ContactPanel>
);

/** A different glyph and shorter copy. */
export const AltGlyph = () => (
  <FormThanks icon="◈" title="You're on the list" desc="We'll be in touch before the next maintenance window." />
);
