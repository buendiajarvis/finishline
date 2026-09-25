import { MetricBars, IntelCard } from "finishline-msp-ds";

/** The default ten-bar shape, with a lit tail. */
export const Default = () => (
  <div style={{ display: "flex", gap: 32, alignItems: "flex-end" }}>
    <MetricBars active={[5, 7, 8]} />
    <MetricBars />
  </div>
);

/** Different data shapes — rising, flat, and spiky. */
export const Shapes = () => (
  <div style={{ display: "flex", gap: 32, alignItems: "flex-end" }}>
    <MetricBars values={[10, 20, 30, 40, 50, 60, 70, 80, 90, 100]} active={[9]} />
    <MetricBars values={[55, 52, 58, 54, 56, 53, 57, 55, 54, 56]} />
    <MetricBars values={[20, 90, 25, 85, 30, 95, 22, 88, 26, 92]} active={[1, 3, 5, 7, 9]} />
  </div>
);

/** In its real home — the viz slot of a large IntelCard. */
export const InALargeCard = () => (
  <div className="intel-grid">
    <IntelCard
      large
      tag="Ticket volume"
      metric="146"
      label="Last 30 days"
      desc="Resolved without an onsite visit."
      viz={<MetricBars active={[5, 7, 8]} />}
    />
  </div>
);
