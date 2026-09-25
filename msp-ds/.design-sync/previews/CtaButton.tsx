import { CtaButton } from "finishline-msp-ds";

/** The three variants — the component's primary axis. */
export const Variants = () => (
  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
    <CtaButton href="#ticket">Submit a ticket</CtaButton>
    <CtaButton href="/msp" variant="ghost">See what we cover</CtaButton>
    <CtaButton href="mailto:support@finishlinemsp.com" variant="quiet">Or email support →</CtaButton>
  </div>
);

/** The hero action row — solid primary beside a quiet secondary. */
export const HeroActions = () => (
  <div className="hero-actions">
    <CtaButton href="#ticket">Submit a ticket</CtaButton>
    <CtaButton href="mailto:support@finishlinemsp.com" variant="quiet">Or email support →</CtaButton>
  </div>
);

/** Label lengths, to show the button hugs its content. */
export const Labels = () => (
  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
    <CtaButton href="#a">Call</CtaButton>
    <CtaButton href="#b">Submit a ticket</CtaButton>
    <CtaButton href="#c">Book a 30-minute infrastructure review</CtaButton>
  </div>
);
