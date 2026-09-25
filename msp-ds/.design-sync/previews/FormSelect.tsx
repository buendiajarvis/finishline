import { FormSelect, FormField, Form } from "finishline-msp-ds";

/** The urgency select from the live ticket form. */
export const Urgency = () => (
  <Form>
    <FormField label="How urgent?" htmlFor="fs-urg">
      <FormSelect id="fs-urg" defaultValue="today">
        <option value="down">Everything is down</option>
        <option value="today">Needs fixing today</option>
        <option value="week">Sometime this week</option>
        <option value="quote">Just a quote</option>
      </FormSelect>
    </FormField>
  </Form>
);

/** Request type, plus a disabled select. */
export const States = () => (
  <Form>
    <FormField label="Request type" htmlFor="fs-type">
      <FormSelect id="fs-type" defaultValue="support">
        <option value="new">New service</option>
        <option value="support">Technical support</option>
        <option value="quote">Request a quote</option>
      </FormSelect>
    </FormField>
    <FormField label="Disabled" htmlFor="fs-dis">
      <FormSelect id="fs-dis" defaultValue="support" disabled>
        <option value="support">Technical support</option>
      </FormSelect>
    </FormField>
  </Form>
);
