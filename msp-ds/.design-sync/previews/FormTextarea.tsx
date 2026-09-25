import { FormTextarea, FormField, Form } from "finishline-msp-ds";

/** Empty and filled, at the default minimum height. */
export const States = () => (
  <Form>
    <FormField label="What's wrong?" htmlFor="fta-a">
      <FormTextarea id="fta-a" placeholder="Server room is beeping and nobody in the office can print." />
    </FormField>
    <FormField label="Filled" htmlFor="fta-b">
      <FormTextarea
        id="fta-b"
        defaultValue={"The main switch in the server closet started alarming around 6am. Nobody can print and the POS terminals are offline. We have about 20 staff blocked."}
      />
    </FormField>
  </Form>
);

/** A taller textarea via rows. */
export const Tall = () => (
  <Form>
    <FormField label="Describe the environment" htmlFor="fta-tall">
      <FormTextarea id="fta-tall" rows={8} placeholder="Sites, rough device counts, and anything already known to be failing." />
    </FormField>
  </Form>
);
