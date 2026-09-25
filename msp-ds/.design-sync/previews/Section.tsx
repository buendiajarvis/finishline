import { Section, Container, SectionLabel, CapabilityCard } from "finishline-msp-ds";

/** Default band on the page background. */
export const Default = () => (
  <Section>
    <Container>
      <SectionLabel>Section 01 // Coverage</SectionLabel>
      <h2 style={{ fontSize: 24, fontWeight: 600 }}>96px of air above and below.</h2>
      <p style={{ marginTop: 12, color: "var(--on-surface-variant)" }}>
        The standard vertical rhythm for a content band.
      </p>
    </Container>
  </Section>
);

/** Sunken band — one surface step darker, used to separate neighbouring sections. */
export const Sunken = () => (
  <Section sunken>
    <Container>
      <SectionLabel>Section 02 // Approach</SectionLabel>
      <h2 style={{ fontSize: 24, fontWeight: 600 }}>Sunken, on surface-container-lowest.</h2>
      <p style={{ marginTop: 12, color: "var(--on-surface-variant)" }}>
        No border needed — the surface step does the separating.
      </p>
    </Container>
  </Section>
);

/** The two alternating, which is how the live page reads top to bottom. */
export const Alternating = () => (
  <div>
    <Section>
      <Container>
        <SectionLabel>Default</SectionLabel>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Page background</h2>
      </Container>
    </Section>
    <Section sunken>
      <Container>
        <SectionLabel>Sunken</SectionLabel>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>One step darker</h2>
      </Container>
    </Section>
    <Section>
      <Container>
        <SectionLabel>Default</SectionLabel>
        <h2 style={{ fontSize: 20, fontWeight: 600 }}>Back to the page</h2>
      </Container>
    </Section>
  </div>
);
