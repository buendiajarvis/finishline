import { PanelDivider, ContactPanel, FormField, FormInput, FormNote } from "finishline-msp-ds";

/** Separating stacked rows inside a panel — its real job. */
export const InAPanel = () => (
  <ContactPanel header="Submit a ticket">
    <FormField label="Name" htmlFor="pd-name">
      <FormInput id="pd-name" placeholder="Jane Okonkwo" />
    </FormField>
    <PanelDivider />
    <FormField label="Work email" htmlFor="pd-email">
      <FormInput id="pd-email" type="email" placeholder="jane@northwind.com" />
    </FormField>
    <PanelDivider />
    <FormNote>A real engineer responds in under 15 minutes.</FormNote>
  </ContactPanel>
);

/** The hairline on its own, between two blocks of copy. */
export const Standalone = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
    <div style={{ color: "var(--on-surface-variant)" }}>Above the rule.</div>
    <PanelDivider />
    <div style={{ color: "var(--on-surface-variant)" }}>Below the rule.</div>
  </div>
);
