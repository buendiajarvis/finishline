import * as React from "react";
import { cx } from "./util";

/**
 * Page-width wrapper. Caps content at 1440px and applies the responsive
 * side margins (64px desktop, 24px tablet, 20px mobile). Every full-width
 * section on finishlinemsp.com puts its content inside one of these.
 */
export function Container({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("container", className)} {...rest}>
      {children}
    </div>
  );
}

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Paint the section on `--surface-container-lowest` instead of the page background. */
  sunken?: boolean;
}

/**
 * Vertical rhythm band — 96px of padding above and below. Alternate `sunken`
 * sections to separate one band of content from the next without a border.
 */
export function Section({ sunken = false, className, children, ...rest }: SectionProps) {
  return (
    <section className={cx("section", sunken && "section-sunken", className)} {...rest}>
      {children}
    </section>
  );
}

/**
 * The 12-column grid every layout on the site is built on, with the 24px
 * gutter. Children set their own span (`grid-column: span 4`) or use the
 * components that already do.
 */
export function Grid12({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("grid-12", className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * Small uppercase cyan mono label that opens a section — the "SECTION 01 //
 * WHAT WE RUN FOR YOU" eyebrow. The most recognizable piece of the brand's
 * micro-typography.
 */
export function SectionLabel({ className, children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cx("section-label", className)} {...rest}>
      {children}
    </span>
  );
}

/**
 * Monospace data type — 14px JetBrains Mono at the system's data line-height.
 * Use for readouts, counts, timestamps, and anything that should read as
 * telemetry rather than prose.
 */
export function MonoData({ className, children, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cx("mono-data", className)} {...rest}>
      {children}
    </span>
  );
}

/**
 * One-pixel hairline in the outline-variant colour. Separates stacked rows
 * inside panels.
 */
export function PanelDivider({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("panel-divider", className)} {...rest} />;
}

/**
 * The 6px cyan square that pulses on a 2s loop — the site's "system is live"
 * signal. Honours `prefers-reduced-motion` by holding still.
 */
export function PulseDot({ className, ...rest }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("panel-dot", className)} aria-hidden {...rest} />;
}

export interface IndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** `live` glows cyan; `standby` is a flat grey square. */
  state?: "live" | "standby";
}

/**
 * Static 6px status square. `live` glows cyan, `standby` is inert grey —
 * the vocabulary the status panel and contact bullet lists use.
 */
export function Indicator({ state = "live", className, ...rest }: IndicatorProps) {
  return <span className={cx("indicator", state, className)} aria-hidden {...rest} />;
}
