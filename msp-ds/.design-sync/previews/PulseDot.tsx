import { PulseDot } from "finishline-msp-ds";

/** The live signal in an eyebrow row, as the hero uses it. */
export const InAnEyebrow = () => (
  <div className="hero-eyebrow">
    <PulseDot />
    Managed IT // Always On
  </div>
);

/** Beside a status readout, which is the other place it appears. */
export const WithStatus = () => (
  <div className="intel-status">
    <PulseDot />
    LIVE // UPDATED 4 MIN AGO
  </div>
);

/** Bare, at the size it actually renders — a 6px cyan square with a glow. */
export const Bare = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 0" }}>
    <PulseDot />
    <span style={{ fontFamily: "var(--ff-mono)", fontSize: 12, color: "var(--on-surface-variant)" }}>
      6px — pulses on a 2s loop, still under prefers-reduced-motion
    </span>
  </div>
);
