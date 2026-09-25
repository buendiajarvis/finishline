import * as React from "react";
import { cx } from "./util";

export interface ContactPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Uppercase cyan mono header at the top of the panel. */
  header?: React.ReactNode;
}

/**
 * Bordered panel on the sunken surface that holds the ticket form. Spans the
 * right six columns of a `ContactLayout` and goes full width at 1024px.
 */
export function ContactPanel({ header, className, children, ...rest }: ContactPanelProps) {
  return (
    <div className={cx("contact-panel", className)} {...rest}>
      {header && <div className="contact-panel-header">{header}</div>}
      {children}
    </div>
  );
}

/**
 * Bulleted promise list — mono text with a glowing cyan square per row. The
 * MSP page uses it for the three response guarantees beside the form.
 */
export function ContactPoints({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("contact-points", className)} {...rest}>
      {children}
    </div>
  );
}

/**
 * One row of a `ContactPoints` list — a cyan indicator square and mono copy,
 * top-aligned so multi-line rows stay tidy.
 */
export function ContactPoint({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("contact-point", className)} {...rest}>
      <span className="indicator" aria-hidden />
      <span>{children}</span>
    </div>
  );
}

export interface ContactLayoutProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Display headline on the left. */
  title?: React.ReactNode;
  /** Supporting paragraph under the headline. */
  subtitle?: React.ReactNode;
  /** Small block above the headline — usually a `SectionLabel`. */
  eyebrow?: React.ReactNode;
  /** Left column extras — typically a `ContactPoints` list. */
  intro?: React.ReactNode;
  /** Direct-contact line under the intro, e.g. a support mailto. */
  direct?: React.ReactNode;
  /** Right column — usually a `ContactPanel` wrapping the form. */
  panel?: React.ReactNode;
}

/**
 * The contact page's two-column shell — copy and promises on the left five
 * columns, the form panel on the right six. Both columns go full width at
 * 1024px. Includes the top padding that clears the fixed nav.
 */
export function ContactLayout({
  title,
  subtitle,
  eyebrow,
  intro,
  direct,
  panel,
  className,
  children,
  ...rest
}: ContactLayoutProps) {
  return (
    <main className={cx("contact", className)} {...rest}>
      <div className="container">
        <div className="contact-grid">
          <div className="contact-intro">
            {eyebrow}
            {title && <h1 className="contact-title">{title}</h1>}
            {subtitle && <p className="contact-subtitle">{subtitle}</p>}
            {intro}
            {direct && <div className="contact-direct">{direct}</div>}
            {children}
          </div>
          {panel}
        </div>
      </div>
    </main>
  );
}
