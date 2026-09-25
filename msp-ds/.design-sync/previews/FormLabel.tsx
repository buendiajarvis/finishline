import { FormLabel, FormInput } from "finishline-msp-ds";

/** Hand-assembled label-and-control pairing. */
export const WithAControl = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 360 }}>
    <FormLabel htmlFor="fl-email">Work email</FormLabel>
    <FormInput id="fl-email" type="email" placeholder="jane@northwind.com" />
  </div>
);

/** The label type on its own — 12px mono, uppercase, 0.05em tracking. */
export const LabelsOnly = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <FormLabel>Name</FormLabel>
    <FormLabel>Work email</FormLabel>
    <FormLabel>What&apos;s wrong?</FormLabel>
    <FormLabel>Preferred callback window</FormLabel>
  </div>
);
