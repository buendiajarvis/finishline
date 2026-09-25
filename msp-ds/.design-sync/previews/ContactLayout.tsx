import {
  ContactLayout, ContactPanel, ContactPoints, ContactPoint, SectionLabel,
  Form, FormRow, FormField, FormInput, FormTextarea, FormSubmit, FormNote,
} from "finishline-msp-ds";

/** The finishlinemsp.com/msp contact page, assembled. */
export const TicketPage = () => (
  <ContactLayout
    eyebrow={<SectionLabel>Submit a ticket</SectionLabel>}
    title="Something broken? Tell us what's wrong."
    subtitle="Fill this out and a FinishLine engineer contacts you within 15 minutes. No phone tree, no ticket purgatory — a real person who can actually fix it."
    intro={
      <ContactPoints>
        <ContactPoint>A real engineer responds in under 15 minutes</ContactPoint>
        <ContactPoint>We triage remotely first, dispatch onsite if needed</ContactPoint>
        <ContactPoint>You get a direct line back to the person handling it</ContactPoint>
      </ContactPoints>
    }
    direct={
      <>
        Or email <a href="mailto:support@finishlinemsp.com">support@finishlinemsp.com</a>
      </>
    }
    panel={
      <ContactPanel header="Submit a ticket">
        <Form>
          <FormRow>
            <FormField label="Name" htmlFor="cl-name"><FormInput id="cl-name" placeholder="Jane Okonkwo" /></FormField>
            <FormField label="Company" htmlFor="cl-co"><FormInput id="cl-co" placeholder="Northwind Dental" /></FormField>
          </FormRow>
          <FormField label="Work email" htmlFor="cl-email"><FormInput id="cl-email" type="email" placeholder="jane@northwind.com" /></FormField>
          <FormField label="What's wrong?" htmlFor="cl-detail">
            <FormTextarea id="cl-detail" placeholder="Server room is beeping and nobody can print." />
          </FormField>
          <FormSubmit>Submit ticket</FormSubmit>
          <FormNote>A real engineer responds in under 15 minutes.</FormNote>
        </Form>
      </ContactPanel>
    }
  />
);

/** Copy column only — no panel, for a simpler contact page. */
export const CopyOnly = () => (
  <ContactLayout
    title="Talk to an engineer."
    subtitle="No sales tower, no discovery-call gauntlet. You get the person who will actually run your infrastructure."
    direct={
      <>
        Email <a href="mailto:support@finishlinemsp.com">support@finishlinemsp.com</a> or call (415) 555-0142
      </>
    }
  />
);
