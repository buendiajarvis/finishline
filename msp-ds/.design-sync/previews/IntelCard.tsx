import { IntelCard, MetricBars } from "finishline-msp-ds";

/** Three standard telemetry tiles across a row. */
export const Row = () => (
  <div className="intel-grid">
    <IntelCard tag="Response" metric="11" metricUnit="min" label="Median first touch" desc="Across every ticket opened this month." />
    <IntelCard tag="Coverage" metric="24/7" label="Monitoring window" desc="Alerting routed to an on-call engineer, not a queue." />
    <IntelCard tag="Uptime" metric="99.98" metricUnit="%" label="Managed endpoints" desc="Rolling 90-day average across every managed site." />
  </div>
);

/** The large variant — copy beside a bar visualization. */
export const Large = () => (
  <div className="intel-grid">
    <IntelCard
      large
      tag="Ticket volume"
      metric="146"
      label="Last 30 days"
      desc="Resolved without an onsite visit."
      viz={<MetricBars active={[5, 7, 8]} />}
    />
    <IntelCard
      large
      tag="Patch compliance"
      metric="98"
      metricUnit="%"
      label="Endpoints current"
      desc="Measured nightly against the vendor advisories."
      viz={<MetricBars values={[60, 68, 72, 75, 80, 84, 88, 92, 95, 98]} active={[8, 9]} />}
    />
  </div>
);

/** Standard and large together, as the feed mixes them. */
export const Mixed = () => (
  <div className="intel-grid">
    <IntelCard
      large
      tag="Ticket volume"
      metric="146"
      label="Last 30 days"
      desc="Resolved without an onsite visit."
      viz={<MetricBars active={[5, 7, 8]} />}
    />
    <IntelCard tag="Response" metric="11" metricUnit="min" label="Median first touch" desc="Across every ticket this month." />
  </div>
);

/** Text-only tile — no metric, just tag and copy. */
export const TextOnly = () => (
  <div className="intel-grid">
    <IntelCard
      tag="Advisory"
      label="Published 2 hours ago"
      desc="A critical firewall firmware advisory landed overnight. Every managed edge device has been patched and verified."
    />
  </div>
);
