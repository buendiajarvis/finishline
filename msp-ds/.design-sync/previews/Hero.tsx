import { Hero, CtaButton } from "finishline-msp-ds";

/** The MSP page hero, verbatim — the canonical use. */
export const MspHero = () => (
  <Hero
    eyebrow="Managed IT // Always On"
    pulse
    title={
      <>
        Your IT, handled — <span className="glow">before it breaks.</span>
      </>
    }
    subtitle="FinishLine is the managed IT partner for businesses that can't afford downtime. Monitoring, security, helpdesk, and cloud — one flat monthly fee, one team that owns the outcome. Something broken right now? Submit a ticket and a real engineer contacts you within 15 minutes."
    actions={
      <>
        <CtaButton href="#ticket">Submit a ticket</CtaButton>
        <CtaButton href="mailto:support@finishlinemsp.com" variant="quiet">
          Or email support →
        </CtaButton>
      </>
    }
  />
);

/** Headline only — no eyebrow, no actions. The minimum that still reads as the brand. */
export const Minimal = () => (
  <Hero
    title="One team for everything with a power cord."
    subtitle="Helpdesk, network, security, and cloud under a single flat monthly fee."
  />
);

/** Without the cyan accent span, to show the plain display treatment. */
export const PlainHeadline = () => (
  <Hero
    eyebrow="Section 01 // What we run for you"
    title="Onboarding takes two weeks, not two quarters."
    subtitle="We inventory every device, licence, and vendor you are paying for, then stabilise whatever is on fire first."
    actions={<CtaButton href="/approach" variant="ghost">See the approach</CtaButton>}
  />
);
