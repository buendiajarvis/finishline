import { SiteNav } from "finishline-msp-ds";

/** The MSP page header — links plus the ticket CTA. */
export const Full = () => (
  <SiteNav
    inFlow
    brand="FinishLine"
    links={[
      { label: "Services", href: "#services" },
      { label: "Approach", href: "#approach" },
      { label: "Telemetry", href: "#intel" },
    ]}
    cta={{ label: "Submit a ticket", href: "#ticket" }}
  />
);

/** Brand and CTA only — the shape the contact page uses. */
export const BrandAndCta = () => (
  <SiteNav inFlow brand="FinishLine" cta={{ label: "Request briefing", href: "/contact" }} />
);

/** Wordmark alone, no links and no CTA. */
export const BrandOnly = () => <SiteNav inFlow brand="FinishLine" />;
