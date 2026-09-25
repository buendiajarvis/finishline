import { ContactPoints, ContactPoint } from "finishline-msp-ds";

/** The three response promises from the live MSP page. */
export const Promises = () => (
  <ContactPoints>
    <ContactPoint>A real engineer responds in under 15 minutes</ContactPoint>
    <ContactPoint>We triage remotely first, dispatch onsite if needed</ContactPoint>
    <ContactPoint>You get a direct line back to the person handling it</ContactPoint>
  </ContactPoints>
);

/** A longer list, including a row that wraps to two lines. */
export const Longer = () => (
  <ContactPoints>
    <ContactPoint>24/7 monitoring with alerting routed to an on-call engineer</ContactPoint>
    <ContactPoint>Flat monthly fee — no hourly billing and no surprise invoices</ContactPoint>
    <ContactPoint>Onsite dispatch across the Bay Area, usually the same day</ContactPoint>
    <ContactPoint>
      Tested backups verified every quarter, so a ransomware incident is an inconvenience rather
      than an existential event for your business
    </ContactPoint>
  </ContactPoints>
);
