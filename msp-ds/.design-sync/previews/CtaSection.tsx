import { CtaSection, CtaButton, StatusPanel, SectionLabel } from "finishline-msp-ds";

/** The closing band with its status panel — the canonical composition. */
export const WithStatusPanel = () => (
  <CtaSection
    eyebrow={<SectionLabel>Ready when you are</SectionLabel>}
    title="Something broken right now?"
    desc="Submit a ticket and a real engineer contacts you within 15 minutes. No phone tree, no ticket purgatory — a real person who can actually fix it."
    actions={<CtaButton href="#ticket">Submit a ticket</CtaButton>}
    aside={
      <StatusPanel
        header="System status"
        rows={[
          { label: "Helpdesk — accepting tickets", state: "live" },
          { label: "Monitoring — all sites green", state: "live" },
          { label: "Onsite dispatch — standby", state: "standby" },
        ]}
      />
    }
  />
);

/** Copy and buttons only, no aside. */
export const CopyOnly = () => (
  <CtaSection
    title="One flat monthly fee. One team that owns the outcome."
    desc="No hourly billing, no surprise invoices, no finger-pointing between vendors."
    actions={
      <div className="hero-actions">
        <CtaButton href="/contact">Request a quote</CtaButton>
        <CtaButton href="/msp" variant="ghost">See what we cover</CtaButton>
      </div>
    }
  />
);
