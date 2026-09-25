import { FormInput, FormField, Form } from "finishline-msp-ds";

/** Placeholder, filled, and disabled — the states that render statically. */
export const States = () => (
  <Form>
    <FormField label="Empty" htmlFor="fi-a"><FormInput id="fi-a" placeholder="jane@northwind.com" /></FormField>
    <FormField label="Filled" htmlFor="fi-b"><FormInput id="fi-b" defaultValue="jane@northwind.com" /></FormField>
    <FormField label="Disabled" htmlFor="fi-c"><FormInput id="fi-c" defaultValue="Locked while sending" disabled /></FormField>
    <FormField label="Required" htmlFor="fi-d"><FormInput id="fi-d" placeholder="Required field" required /></FormField>
  </Form>
);

/** Input types the ticket form uses. */
export const Types = () => (
  <Form>
    <FormField label="Text" htmlFor="ft-text"><FormInput id="ft-text" placeholder="Jane Okonkwo" /></FormField>
    <FormField label="Email" htmlFor="ft-email"><FormInput id="ft-email" type="email" placeholder="jane@northwind.com" /></FormField>
    <FormField label="Phone" htmlFor="ft-tel"><FormInput id="ft-tel" type="tel" placeholder="(415) 555-0142" /></FormField>
  </Form>
);
