import {
  Form,
  FormRow,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormSubmit,
  FormNote,
  FormHoneypot,
  FormThanks,
} from "finishline-msp-ds";

/** The full ticket form from finishlinemsp.com/msp — the canonical composition. */
export const TicketForm = () => (
  <Form>
    <FormRow>
      <FormField label="Name" htmlFor="tf-name">
        <FormInput id="tf-name" name="name" placeholder="Jane Okonkwo" />
      </FormField>
      <FormField label="Company" htmlFor="tf-co">
        <FormInput id="tf-co" name="company" placeholder="Northwind Dental" />
      </FormField>
    </FormRow>
    <FormRow>
      <FormField label="Work email" htmlFor="tf-email">
        <FormInput id="tf-email" name="email" type="email" placeholder="jane@northwind.com" />
      </FormField>
      <FormField label="Phone" htmlFor="tf-phone">
        <FormInput id="tf-phone" name="phone" type="tel" placeholder="(415) 555-0142" />
      </FormField>
    </FormRow>
    <FormField label="How urgent?" htmlFor="tf-urgency">
      <FormSelect id="tf-urgency" name="urgency" defaultValue="today">
        <option value="down">Everything is down</option>
        <option value="today">Needs fixing today</option>
        <option value="week">Sometime this week</option>
        <option value="quote">Just a quote</option>
      </FormSelect>
    </FormField>
    <FormField label="What's wrong?" htmlFor="tf-detail">
      <FormTextarea
        id="tf-detail"
        name="detail"
        placeholder="Server room is beeping and nobody in the office can print."
      />
    </FormField>
    <FormHoneypot />
    <FormSubmit>Submit ticket</FormSubmit>
    <FormNote>A real engineer responds in under 15 minutes.</FormNote>
  </Form>
);

/** A two-up row beside a full-width field — the layout primitive on its own. */
export const RowAndFullField = () => (
  <Form>
    <FormRow>
      <FormField label="First name" htmlFor="rf-first">
        <FormInput id="rf-first" placeholder="Jane" />
      </FormField>
      <FormField label="Last name" htmlFor="rf-last">
        <FormInput id="rf-last" placeholder="Okonkwo" />
      </FormField>
      <FormField label="Site address" htmlFor="rf-addr" full>
        <FormInput id="rf-addr" placeholder="1200 Harrison St, San Francisco" />
      </FormField>
    </FormRow>
  </Form>
);

/** Every control the system ships, stacked. */
export const Controls = () => (
  <Form>
    <FormField label="Text input" htmlFor="c-text">
      <FormInput id="c-text" placeholder="Placeholder copy" />
    </FormField>
    <FormField label="Select" htmlFor="c-sel">
      <FormSelect id="c-sel" defaultValue="support">
        <option value="new">New service</option>
        <option value="support">Technical support</option>
        <option value="quote">Request a quote</option>
      </FormSelect>
    </FormField>
    <FormField label="Textarea" htmlFor="c-area">
      <FormTextarea id="c-area" placeholder="Multi-line, vertically resizable." />
    </FormField>
    <FormSubmit>Submit</FormSubmit>
  </Form>
);

/** Submit states — ready and in-flight. */
export const SubmitStates = () => (
  <Form>
    <FormSubmit>Submit ticket</FormSubmit>
    <FormSubmit disabled>Sending…</FormSubmit>
    <FormNote>Disabled drops to half opacity and loses the hover glow.</FormNote>
  </Form>
);

/** The post-submit confirmation the form swaps to. */
export const Confirmation = () => (
  <FormThanks
    title="Ticket received"
    desc="An engineer has been paged and will contact you within 15 minutes. Check your email for the ticket number."
  />
);
