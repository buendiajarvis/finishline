import { IntelFeed, IntelCard, MetricBars, Container, SectionLabel } from "finishline-msp-ds";

/** The full telemetry section with its live status readout. */
export const LiveFeed = () => (
  <Container>
    <IntelFeed
      subtitle={<SectionLabel>Telemetry</SectionLabel>}
      title="What we are watching right now."
      status="LIVE // UPDATED 4 MIN AGO"
    >
      <IntelCard tag="Response" metric="11" metricUnit="min" label="Median first touch" desc="Across every ticket opened this month." />
      <IntelCard tag="Coverage" metric="24/7" label="Monitoring window" desc="Alerting routed to an on-call engineer." />
      <IntelCard tag="Uptime" metric="99.98" metricUnit="%" label="Managed endpoints" desc="Rolling 90-day average." />
      <IntelCard
        large
        tag="Ticket volume"
        metric="146"
        label="Last 30 days"
        desc="Resolved without an onsite visit."
        viz={<MetricBars active={[5, 7, 8]} />}
      />
      <IntelCard tag="Backups" metric="41" label="Restores tested" desc="Every managed site, verified this quarter." />
    </IntelFeed>
  </Container>
);

/** Without the status readout. */
export const NoStatus = () => (
  <Container>
    <IntelFeed title="Coverage at a glance.">
      <IntelCard tag="Sites" metric="14" label="Under management" desc="Across three counties." />
      <IntelCard tag="Endpoints" metric="612" label="Agents reporting" desc="Checked in within the last five minutes." />
      <IntelCard tag="Escalations" metric="0" label="Open critical" desc="Nothing currently paging an engineer." />
    </IntelFeed>
  </Container>
);
