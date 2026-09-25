import { AppShell, SiteNav, Hero, CtaButton, SiteFooter, Container, SectionLabel } from "finishline-msp-ds";

/** A whole screen inside the shell — nav, hero, footer — as a real page would be assembled. */
export const FullScreen = () => (
  <AppShell>
    <SiteNav
      inFlow
      brand="FinishLine"
      links={[
        { label: "Services", href: "#services" },
        { label: "Approach", href: "#approach" },
      ]}
      cta={{ label: "Submit a ticket", href: "#ticket" }}
    />
    <Hero
      eyebrow="Managed IT // Always On"
      pulse
      title={
        <>
          Your IT, handled — <span className="glow">before it breaks.</span>
        </>
      }
      subtitle="Monitoring, security, helpdesk, and cloud — one flat monthly fee, one team that owns the outcome."
      actions={<CtaButton href="#ticket">Submit a ticket</CtaButton>}
    />
    <SiteFooter brand="FinishLine" location="Serving the Bay Area" />
  </AppShell>
);

/** The shell's whole job: it paints the ground so light text is readable. */
export const EstablishesTheGround = () => (
  <AppShell style={{ padding: 32 }}>
    <Container>
      <SectionLabel>Inside AppShell</SectionLabel>
      <p style={{ fontSize: 18 }}>
        This paragraph is <code>--on-surface</code> on <code>--background</code>. Outside the
        shell, the same text lands on the browser's white default and is unreadable — this system
        has no light mode.
      </p>
    </Container>
  </AppShell>
);
