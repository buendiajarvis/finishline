import { SectionLabel } from "finishline-msp-ds";

/** The label copy conventions used across the live site. */
export const Variants = () => (
  <div>
    <SectionLabel>Managed IT // Always On</SectionLabel>
    <SectionLabel>Section 01 // What we run for you</SectionLabel>
    <SectionLabel>Submit a ticket</SectionLabel>
    <SectionLabel>Telemetry</SectionLabel>
  </div>
);

/** In context — opening a section above its headline. */
export const AboveAHeadline = () => (
  <div>
    <SectionLabel>Section 02 // How it runs</SectionLabel>
    <h2 style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
      Onboarding takes two weeks, not two quarters.
    </h2>
    <p style={{ marginTop: 12, color: "var(--on-surface-variant)", maxWidth: 480 }}>
      The label is 12px JetBrains Mono in surface-tint, uppercase, with 0.05em tracking.
    </p>
  </div>
);
