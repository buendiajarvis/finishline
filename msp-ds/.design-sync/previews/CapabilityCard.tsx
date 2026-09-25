import { CapabilityCard, CapabilityGrid } from "finishline-msp-ds";

/** The four service cards exactly as the MSP page ships them. */
export const ServiceRow = () => (
  <div className="cap-grid">
    <CapabilityCard
      num="01"
      title="Helpdesk & support"
      desc="Real engineers, not a phone tree. Submit a ticket and get a human on it in minutes."
      span={3}
    />
    <CapabilityCard
      num="02"
      title="Network & infrastructure"
      desc="Wired, wireless, firewalls, servers — monitored 24/7 and fixed before you notice."
      span={3}
    />
    <CapabilityCard
      num="03"
      title="Security & backup"
      desc="Endpoint protection, patching, and tested backups so an incident is an inconvenience, not a crisis."
      span={3}
    />
    <CapabilityCard
      num="04"
      title="Cloud & Microsoft 365"
      desc="Email, identity, and SaaS managed end to end — onboarding to offboarding, locked down."
      span={3}
    />
  </div>
);

/** A single card with the optional glyph slot filled. */
export const WithIcon = () => (
  <div className="cap-grid">
    <CapabilityCard
      icon="◈"
      num="Service 02"
      title="Network & infrastructure"
      desc="Wired, wireless, firewalls, servers — monitored around the clock and fixed before you notice."
      span={6}
    />
  </div>
);

/** The span axis: three-up, two-up, and full width. */
export const Spans = () => (
  <div className="cap-grid">
    <CapabilityCard num="span 4" title="Three across" desc="The default — three cards fill a row." span={4} />
    <CapabilityCard num="span 4" title="Three across" desc="Equal weight, equal width." span={4} />
    <CapabilityCard num="span 4" title="Three across" desc="The grid does the reflowing." span={4} />
    <CapabilityCard num="span 6" title="Two across" desc="Wider cards for longer copy." span={6} />
    <CapabilityCard num="span 6" title="Two across" desc="Still on the same 12-column grid." span={6} />
    <CapabilityCard num="span 12" title="Full width" desc="For a single closing point." span={12} />
  </div>
);

/** Inside its grid wrapper, with the header row the site pairs it with. */
export const InGrid = () => (
  <CapabilityGrid
    headline="One team for everything with a power cord."
    body="Monitoring, security, helpdesk, and cloud — scoped in weeks, not quarters."
  >
    <CapabilityCard num="01" title="Helpdesk & support" desc="Real engineers, not a phone tree." span={4} />
    <CapabilityCard num="02" title="Network & infrastructure" desc="Monitored 24/7, fixed before you notice." span={4} />
    <CapabilityCard num="03" title="Security & backup" desc="Patching and tested backups, every week." span={4} />
  </CapabilityGrid>
);
