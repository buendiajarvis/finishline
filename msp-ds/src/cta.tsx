import * as React from "react";
import { cx } from "./util";

export interface CtaButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * `solid` is the cyan block button, `ghost` is the cyan outline, `quiet` is
   * the bare inline link the hero uses for its secondary action.
   */
  variant?: "solid" | "ghost" | "quiet";
}

/**
 * The site's link button — uppercase mono, square corners, and a cyan glow on
 * hover. Renders an anchor, since every call to action on the site navigates.
 */
export function CtaButton({ variant = "solid", className, children, ...rest }: CtaButtonProps) {
  return (
    <a
      className={cx("cta-button", variant !== "solid" && variant, className)}
      {...rest}
    >
      {children}
    </a>
  );
}

export interface StatusRow {
  /** Row text. */
  label: React.ReactNode;
  /** `live` glows cyan, `standby` is grey. */
  state?: "live" | "standby";
}

export interface StatusPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Uppercase cyan mono header, e.g. "SYSTEM STATUS". */
  header?: React.ReactNode;
  /** Rows, each with its own indicator state. */
  rows?: StatusRow[];
}

/**
 * Sunken side panel listing status rows, each with a square indicator. The
 * marketing site uses it beside the closing CTA to show what is live and what
 * is on standby.
 */
export function StatusPanel({ header, rows = [], className, children, ...rest }: StatusPanelProps) {
  return (
    <div className={cx("cta-panel", className)} {...rest}>
      {header && <div className="cta-panel-header">{header}</div>}
      {rows.map((r, i) => (
        <div key={i} className="cta-panel-row">
          <span className={cx("indicator", r.state ?? "live")} aria-hidden />
          {r.label}
        </div>
      ))}
      {children}
    </div>
  );
}

export interface CtaSectionProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Section heading. */
  title?: React.ReactNode;
  /** Supporting paragraph under the heading. */
  desc?: React.ReactNode;
  /** Small block above the heading — usually a `SectionLabel`. */
  eyebrow?: React.ReactNode;
  /** Buttons under the copy. */
  actions?: React.ReactNode;
  /** Right-hand column — usually a `StatusPanel` or a form. */
  aside?: React.ReactNode;
}

/**
 * Closing call-to-action band on the sunken background — copy and buttons on
 * the left seven columns, an optional panel on the right four. The aside drops
 * below the copy at 1024px.
 */
export function CtaSection({
  title,
  desc,
  eyebrow,
  actions,
  aside,
  className,
  children,
  ...rest
}: CtaSectionProps) {
  return (
    <section className={cx("cta-section", className)} {...rest}>
      <div className="container">
        <div className="cta-grid">
          <div className="cta-content">
            {eyebrow}
            {title && <div className="cta-title">{title}</div>}
            {desc && <div className="cta-desc">{desc}</div>}
            {actions}
            {children}
          </div>
          {aside}
        </div>
      </div>
    </section>
  );
}
