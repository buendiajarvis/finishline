import { Container, SectionLabel, CapabilityCard } from "finishline-msp-ds";

/** Content centred and capped at 1440px with the system's 64px page margins. */
export const Default = () => (
  <Container>
    <SectionLabel>Section 01 // What we run for you</SectionLabel>
    <h2 style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.01em" }}>
      One team for everything with a power cord.
    </h2>
    <p style={{ marginTop: 12, color: "var(--on-surface-variant)", maxWidth: 540 }}>
      Everything inside sits within the page gutter, so bands of content line up down the page.
    </p>
  </Container>
);

/** Holding a grid — the usual job on a marketing page. */
export const WrappingAGrid = () => (
  <Container>
    <SectionLabel>Services</SectionLabel>
    <div className="cap-grid">
      <CapabilityCard num="01" title="Helpdesk" desc="A human on it in minutes." span={4} />
      <CapabilityCard num="02" title="Network" desc="Monitored around the clock." span={4} />
      <CapabilityCard num="03" title="Security" desc="Patched and backed up weekly." span={4} />
    </div>
  </Container>
);
