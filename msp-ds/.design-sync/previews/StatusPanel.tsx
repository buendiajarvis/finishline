import { StatusPanel } from "finishline-msp-ds";

/** Mixed live and standby rows — the live site's closing panel. */
export const SystemStatus = () => (
  <StatusPanel
    header="System status"
    rows={[
      { label: "Helpdesk — accepting tickets", state: "live" },
      { label: "Monitoring — all sites green", state: "live" },
      { label: "Onsite dispatch — standby", state: "standby" },
      { label: "After-hours escalation — standby", state: "standby" },
    ]}
  />
);

/** Everything live. */
export const AllLive = () => (
  <StatusPanel
    header="Coverage"
    rows={[
      { label: "Network monitoring", state: "live" },
      { label: "Endpoint protection", state: "live" },
      { label: "Backup verification", state: "live" },
    ]}
  />
);

/** Header only, with composed children instead of rows. */
export const WithChildren = () => (
  <StatusPanel header="Next window">
    <div className="cta-panel-row">Patching — Sunday 02:00 PDT</div>
    <div className="cta-panel-row">Firmware — Sunday 03:30 PDT</div>
  </StatusPanel>
);
