import { ApproachTimeline, Container, SectionLabel } from "finishline-msp-ds";

/** The four-phase engagement timeline, with phase two running. */
export const FourPhases = () => (
  <Container>
    <ApproachTimeline
      eyebrow={<SectionLabel>Section 02 // How it runs</SectionLabel>}
      title="Onboarding takes two weeks, not two quarters."
      phases={[
        { num: "Phase 01", title: "Audit", desc: "We inventory every device, licence, and vendor you are paying for." },
        { num: "Phase 02", title: "Stabilise", desc: "Patch, back up, and lock down whatever is on fire first.", active: true },
        { num: "Phase 03", title: "Monitor", desc: "Agents deployed, alerting wired to a human who answers." },
        { num: "Phase 04", title: "Improve", desc: "Quarterly roadmap so next year's IT costs less than this year's." },
      ]}
    />
  </Container>
);

/** Three phases, none marked active. */
export const ThreePhases = () => (
  <Container>
    <ApproachTimeline
      title="How a migration runs."
      phases={[
        { num: "Step 01", title: "Inventory", desc: "Every mailbox, share, and licence accounted for." },
        { num: "Step 02", title: "Cutover", desc: "Moved over a weekend, with a tested rollback." },
        { num: "Step 03", title: "Handover", desc: "Documentation and a named engineer on the account." },
      ]}
    />
  </Container>
);

/** Timeline with no header block. */
export const Bare = () => (
  <Container>
    <ApproachTimeline
      phases={[
        { num: "01", title: "Audit", desc: "Inventory first." },
        { num: "02", title: "Stabilise", desc: "Fix what is broken.", active: true },
        { num: "03", title: "Monitor", desc: "Alerting to a human." },
        { num: "04", title: "Improve", desc: "Quarterly roadmap." },
      ]}
    />
  </Container>
);
