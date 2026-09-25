import { CapabilityGrid, CapabilityCard, Container } from "finishline-msp-ds";

/** Header row plus the four MSP services — the canonical section. */
export const ServicesSection = () => (
  <Container>
    <CapabilityGrid
      headline="One team for everything with a power cord."
      body="Monitoring, security, helpdesk, and cloud — scoped in weeks, not quarters."
    >
      <CapabilityCard num="01" title="Helpdesk & support" desc="Real engineers, not a phone tree. Submit a ticket and get a human on it in minutes." span={3} />
      <CapabilityCard num="02" title="Network & infrastructure" desc="Wired, wireless, firewalls, servers — monitored 24/7 and fixed before you notice." span={3} />
      <CapabilityCard num="03" title="Security & backup" desc="Endpoint protection, patching, and tested backups." span={3} />
      <CapabilityCard num="04" title="Cloud & Microsoft 365" desc="Email, identity, and SaaS managed end to end." span={3} />
    </CapabilityGrid>
  </Container>
);

/** No header row — just the grid. */
export const GridOnly = () => (
  <Container>
    <CapabilityGrid>
      <CapabilityCard num="01" title="Helpdesk" desc="A human on it in minutes." span={4} />
      <CapabilityCard num="02" title="Network" desc="Monitored around the clock." span={4} />
      <CapabilityCard num="03" title="Security" desc="Patched and backed up weekly." span={4} />
    </CapabilityGrid>
  </Container>
);
