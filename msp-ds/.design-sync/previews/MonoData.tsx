import { MonoData } from "finishline-msp-ds";

/** Telemetry readouts — the register this type is for. */
export const Readouts = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <MonoData>UPTIME 99.98% // 14 SITES MONITORED</MonoData>
    <MonoData>LAST SWEEP 04:12 PDT // NO CRITICAL ALERTS</MonoData>
    <MonoData>TICKETS OPEN 3 // MEDIAN FIRST TOUCH 11 MIN</MonoData>
  </div>
);

/** Mono data beside body prose, showing the split the system relies on. */
export const AgainstProse = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
    <p style={{ color: "var(--on-surface-variant)", lineHeight: 1.6 }}>
      Body copy is Hanken Grotesk. Anything that reads as machine output switches to mono — that
      contrast is the strongest signal in the system.
    </p>
    <MonoData>AGENT v4.2.1 // CHECKED IN 38 SECONDS AGO</MonoData>
  </div>
);
