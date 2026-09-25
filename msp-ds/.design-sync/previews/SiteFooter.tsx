import { SiteFooter } from "finishline-msp-ds";

/** The full footer as the live site ships it. */
export const Full = () => (
  <SiteFooter
    brand="FinishLine"
    links={[
      { label: "Services", href: "/msp" },
      { label: "Approach", href: "/#approach" },
      { label: "Contact", href: "/contact" },
    ]}
    location="Serving the Bay Area"
  />
);

/** Brand and location, no link list. */
export const Minimal = () => <SiteFooter brand="FinishLine" location="Serving the Bay Area" />;
