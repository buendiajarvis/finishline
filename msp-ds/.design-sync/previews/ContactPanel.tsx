import { ContactPanel, Form, FormRow, FormField, FormInput, FormSelect, FormTextarea, FormSubmit, FormNote } from "finishline-msp-ds";

/** The panel holding the ticket form — how the contact page ships it. */
export const WithTicketForm = () => (
  <ContactPanel header="Submit a ticket">
    <Form>
      <FormRow>
        <FormField label="Name" htmlFor="cp-name"><FormInput id="cp-name" placeholder="Jane Okonkwo" /></FormField>
        <FormField label="Company" htmlFor="cp-co"><FormInput id="cp-co" placeholder="Northwind Dental" /></FormField>
      </FormRow>
      <FormField label="Work email" htmlFor="cp-email"><FormInput id="cp-email" type="email" placeholder="jane@northwind.com" /></FormField>
      <FormField label="How urgent?" htmlFor="cp-urg">
        <FormSelect id="cp-urg" defaultValue="today">
          <option value="down">Everything is down</option>
          <option value="today">Needs fixing today</option>
          <option value="quote">Just a quote</option>
        </FormSelect>
      </FormField>
      <FormField label="What's wrong?" htmlFor="cp-detail">
        <FormTextarea id="cp-detail" placeholder="Server room is beeping and nobody can print." />
      </FormField>
      <FormSubmit>Submit ticket</FormSubmit>
      <FormNote>A real engineer responds in under 15 minutes.</FormNote>
    </Form>
  </ContactPanel>
);

/** Panel chrome on its own, with plain content. */
export const Empty = () => (
  <ContactPanel header="Request a quote">
    <p style={{ color: "var(--on-surface-variant)", lineHeight: 1.6 }}>
      Tell us how many sites and endpoints you run and we&apos;ll come back with a flat monthly number.
    </p>
  </ContactPanel>
);
