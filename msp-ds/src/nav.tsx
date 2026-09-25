import * as React from "react";
import { cx } from "./util";

export interface NavLink {
  label: string;
  href: string;
}

export interface SiteNavProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** Wordmark text beside the glowing logo square. */
  brand?: string;
  /** Where the wordmark links to. */
  brandHref?: string;
  /** Middle navigation links. Hidden below 640px, as on the live site. */
  links?: NavLink[];
  /** Solid cyan call-to-action at the right end. Omit to render no CTA. */
  cta?: NavLink;
  /**
   * Render in normal document flow instead of fixed to the viewport top.
   * Fixed is the site default; in-flow is what you want inside a preview,
   * a card, or any bounded container.
   */
  inFlow?: boolean;
}

/**
 * Glassmorphism site header — 56px tall, translucent navy with a 12px
 * backdrop blur and a hairline bottom border. Holds the glowing logo square,
 * the wordmark, uppercase mono links, and one solid cyan CTA.
 */
export function SiteNav({
  brand = "FinishLine",
  brandHref = "/",
  links = [],
  cta,
  inFlow = false,
  className,
  ...rest
}: SiteNavProps) {
  return (
    <nav className={cx("nav", inFlow && "nav-static", className)} {...rest}>
      <div className="nav-inner">
        <a className="nav-brand" href={brandHref}>
          <span className="nav-logo" aria-hidden />
          <span className="nav-name">{brand}</span>
        </a>
        {links.length > 0 && (
          <ul className="nav-links">
            {links.map((l) => (
              <li key={l.href + l.label}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        )}
        {cta && (
          <a className="nav-cta" href={cta.href}>
            {cta.label}
          </a>
        )}
      </div>
    </nav>
  );
}

export interface SiteFooterProps extends Omit<React.HTMLAttributes<HTMLElement>, "children"> {
  /** Wordmark text beside the small cyan square. */
  brand?: string;
  /** Uppercase mono links in the middle. */
  links?: NavLink[];
  /** Right-hand text — the live site uses it for the service location. */
  location?: string;
}

/**
 * Page footer — a top hairline, the brand mark on the left, mono links in the
 * middle, and a location readout on the right. Stacks and centres below 640px.
 */
export function SiteFooter({
  brand = "FinishLine",
  links = [],
  location,
  className,
  ...rest
}: SiteFooterProps) {
  return (
    <footer className={cx("footer", className)} {...rest}>
      <div className="container">
        <div className="footer-inner">
          <a className="footer-brand" href="/">
            <span className="footer-dot" aria-hidden />
            {brand}
          </a>
          {links.length > 0 && (
            <ul className="footer-links">
              {links.map((l) => (
                <li key={l.href + l.label}>
                  <a href={l.href}>{l.label}</a>
                </li>
              ))}
            </ul>
          )}
          {location && <div className="footer-location">{location}</div>}
        </div>
      </div>
    </footer>
  );
}
