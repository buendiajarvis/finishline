import { Indicator } from "finishline-msp-ds";

/** Both states side by side — the only axis this component has. */
export const States = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div className="cta-panel-row">
      <Indicator state="live" />
      Helpdesk — accepting tickets
    </div>
    <div className="cta-panel-row">
      <Indicator state="live" />
      Monitoring — all sites green
    </div>
    <div className="cta-panel-row">
      <Indicator state="standby" />
      Onsite dispatch — standby
    </div>
    <div className="cta-panel-row">
      <Indicator state="standby" />
      After-hours escalation — standby
    </div>
  </div>
);
