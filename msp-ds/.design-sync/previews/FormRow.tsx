import { Form, FormRow, FormField, FormInput } from "finishline-msp-ds";

/** Two fields side by side — the default. */
export const TwoUp = () => (
  <Form>
    <FormRow>
      <FormField label="First name" htmlFor="fr-first"><FormInput id="fr-first" placeholder="Jane" /></FormField>
      <FormField label="Last name" htmlFor="fr-last"><FormInput id="fr-last" placeholder="Okonkwo" /></FormField>
    </FormRow>
  </Form>
);

/** A full-width field spanning both columns of the same row. */
export const WithFullSpan = () => (
  <Form>
    <FormRow>
      <FormField label="First name" htmlFor="fs-first"><FormInput id="fs-first" placeholder="Jane" /></FormField>
      <FormField label="Last name" htmlFor="fs-last"><FormInput id="fs-last" placeholder="Okonkwo" /></FormField>
      <FormField label="Site address" htmlFor="fs-addr" full><FormInput id="fs-addr" placeholder="1200 Harrison St, San Francisco" /></FormField>
    </FormRow>
  </Form>
);

/** Stacked rows, as a longer form reads. */
export const StackedRows = () => (
  <Form>
    <FormRow>
      <FormField label="Name" htmlFor="sr-name"><FormInput id="sr-name" placeholder="Jane Okonkwo" /></FormField>
      <FormField label="Company" htmlFor="sr-co"><FormInput id="sr-co" placeholder="Northwind Dental" /></FormField>
    </FormRow>
    <FormRow>
      <FormField label="Work email" htmlFor="sr-email"><FormInput id="sr-email" type="email" placeholder="jane@northwind.com" /></FormField>
      <FormField label="Phone" htmlFor="sr-phone"><FormInput id="sr-phone" type="tel" placeholder="(415) 555-0142" /></FormField>
    </FormRow>
  </Form>
);
