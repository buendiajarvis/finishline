import { ContactPoints, ContactPoint } from "finishline-msp-ds";

/** A single row — indicator square plus mono copy. */
export const Single = () => (
  <ContactPoints>
    <ContactPoint>A real engineer responds in under 15 minutes</ContactPoint>
  </ContactPoints>
);

/** Short beside long, showing the indicator stays top-aligned when copy wraps. */
export const ShortAndWrapping = () => (
  <ContactPoints>
    <ContactPoint>Onsite dispatch available</ContactPoint>
    <ContactPoint>
      Tested backups verified every quarter, so a ransomware incident is an inconvenience rather
      than an existential event for your business
    </ContactPoint>
  </ContactPoints>
);
