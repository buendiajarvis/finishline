import { Form, FormRow, FormField, FormInput, FormSelect, FormTextarea } from "finishline-msp-ds";

/** The pairing around each control type. */
export const EachControl = () => (
  <Form>
    <FormField label="Work email" htmlFor="ff-email">
      <FormInput id="ff-email" type="email" placeholder="jane@northwind.com" />
    </FormField>
    <FormField label="How urgent?" htmlFor="ff-urgency">
      <FormSelect id="ff-urgency" defaultValue="today">
        <option value="down">Everything is down</option>
        <option value="today">Needs fixing today</option>
        <option value="week">Sometime this week</option>
      </FormSelect>
    </FormField>
    <FormField label="What's wrong?" htmlFor="ff-detail">
      <FormTextarea id="ff-detail" placeholder="Server room is beeping and nobody can print." />
    </FormField>
  </Form>
);

/** The `full` prop against a normal field, inside a row. */
export const FullSpan = () => (
  <Form>
    <FormRow>
      <FormField label="Half width" htmlFor="ffs-a"><FormInput id="ffs-a" placeholder="One column" /></FormField>
      <FormField label="Half width" htmlFor="ffs-b"><FormInput id="ffs-b" placeholder="One column" /></FormField>
      <FormField label="Full width — spans both" htmlFor="ffs-c" full><FormInput id="ffs-c" placeholder="Both columns" /></FormField>
    </FormRow>
  </Form>
);

/** Without a label, when the control is self-evident. */
export const Unlabelled = () => (
  <Form>
    <FormField htmlFor="fu-search">
      <FormInput id="fu-search" placeholder="Search the knowledge base…" />
    </FormField>
  </Form>
);
