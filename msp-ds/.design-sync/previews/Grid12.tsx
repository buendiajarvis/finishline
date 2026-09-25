import { Grid12 } from "finishline-msp-ds";

const Cell = ({ span, label }: { span: number; label: string }) => (
  <div
    style={{
      gridColumn: `span ${span}`,
      background: "var(--surface-container-low)",
      border: "1px solid var(--outline-variant)",
      padding: "16px",
      fontFamily: "var(--ff-mono)",
      fontSize: 12,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      color: "var(--surface-tint)",
    }}
  >
    {label}
  </div>
);

/** The bare 12-column grid with its 24px gutter. */
export const TwelveColumns = () => (
  <Grid12>
    {Array.from({ length: 12 }, (_, i) => (
      <Cell key={i} span={1} label={String(i + 1)} />
    ))}
  </Grid12>
);

/** The column splits the site actually uses. */
export const CommonSplits = () => (
  <Grid12>
    <Cell span={8} label="span 8 — hero / CTA copy" />
    <Cell span={4} label="span 4 — aside panel" />
    <Cell span={6} label="span 6 — contact copy" />
    <Cell span={6} label="span 6 — form panel" />
    <Cell span={3} label="span 3" />
    <Cell span={3} label="span 3" />
    <Cell span={3} label="span 3" />
    <Cell span={3} label="span 3" />
  </Grid12>
);
