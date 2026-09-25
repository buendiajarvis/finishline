import * as React from "react";
import { cx } from "./util";

export interface CapabilityCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Mono index shown above the title, e.g. "01" or "SERVICE 01". */
  num?: string;
  /** Single glyph rendered large and cyan above the index. */
  icon?: React.ReactNode;
  /** Card heading. */
  title: React.ReactNode;
  /** Body copy under the heading. */
  desc?: React.ReactNode;
  /** Grid span out of 12. Defaults to 4 — three cards per row. */
  span?: 3 | 4 | 6 | 12;
}

/**
 * Service / capability tile — sunken panel, hairline border, a 2px cyan pip in
 * the top-left corner, and a border that brightens on hover. The four
 * "what we run for you" cards on the MSP page are these.
 */
export function CapabilityCard({
  num,
  icon,
  title,
  desc,
  span = 4,
  className,
  style,
  children,
  ...rest
}: CapabilityCardProps) {
  return (
    <div
      className={cx("cap-card", className)}
      style={{ gridColumn: `span ${span}`, ...style }}
      {...rest}
    >
      {icon && <div className="cap-card-icon">{icon}</div>}
      {num && <div className="cap-card-num">{num}</div>}
      <div className="cap-card-title">{title}</div>
      {desc && <div className="cap-card-desc">{desc}</div>}
      {children}
    </div>
  );
}

export interface CapabilityGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Headline on the left of the header row. */
  headline?: React.ReactNode;
  /** Supporting copy on the right of the header row. */
  body?: React.ReactNode;
}

/**
 * Wrapper for a row of `CapabilityCard`s — an optional headline/body header
 * row above a 12-column grid. Cards reflow to two-up at 1024px and one-up
 * at 640px on their own.
 */
export function CapabilityGrid({
  headline,
  body,
  className,
  children,
  ...rest
}: CapabilityGridProps) {
  return (
    <div className={cx("capabilities", className)} {...rest}>
      {(headline || body) && (
        <div className="cap-header">
          {headline && <div className="cap-headline">{headline}</div>}
          {body && <div className="cap-body">{body}</div>}
        </div>
      )}
      <div className="cap-grid">{children}</div>
    </div>
  );
}

export interface MetricBarsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Bar heights as percentages, 0-100. Ten bars is the site's default shape. */
  values?: number[];
  /** Indices that render at full cyan instead of the dim tint. */
  active?: number[];
}

/**
 * Compact bar visualization — 120x80, bottom-aligned, dim cyan with selected
 * bars lit. Sits beside the metric inside a large `IntelCard`.
 */
export function MetricBars({
  values = [40, 55, 30, 70, 45, 85, 60, 95, 75, 50],
  active = [],
  className,
  ...rest
}: MetricBarsProps) {
  return (
    <div className={cx("intel-card-viz", className)} aria-hidden {...rest}>
      {values.map((v, i) => (
        <div
          key={i}
          className={cx("bar", active.includes(i) && "active")}
          style={{ height: `${v}%` }}
        />
      ))}
    </div>
  );
}

export interface IntelCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Tiny uppercase cyan tag at the top of the card. */
  tag?: React.ReactNode;
  /** The headline number — rendered at 36px in cyan mono. */
  metric?: React.ReactNode;
  /** Unit or qualifier printed beside the number at data size. */
  metricUnit?: React.ReactNode;
  /** Uppercase mono caption under the metric. */
  label?: React.ReactNode;
  /** Body copy. */
  desc?: React.ReactNode;
  /** Wide two-column variant: copy on the left, `viz` on the right. */
  large?: boolean;
  /** Visualization for the large variant — usually a `MetricBars`. */
  viz?: React.ReactNode;
}

/**
 * Telemetry tile for the intelligence feed — tag, oversized cyan metric, mono
 * caption, and description, on a sunken panel with a cyan corner pip. The
 * `large` variant spans six columns and puts a visualization beside the copy.
 */
export function IntelCard({
  tag,
  metric,
  metricUnit,
  label,
  desc,
  large = false,
  viz,
  className,
  children,
  ...rest
}: IntelCardProps) {
  const body = (
    <>
      {tag && <div className="intel-card-tag">{tag}</div>}
      {metric !== undefined && (
        <div className="intel-card-metric">
          <span className="number">{metric}</span>
          {metricUnit}
        </div>
      )}
      {label && <div className="intel-card-label">{label}</div>}
      {desc && <div className="intel-card-desc">{desc}</div>}
      {children}
    </>
  );

  return (
    <div className={cx("intel-card", large && "large", className)} {...rest}>
      {large ? <div className="intel-card-body">{body}</div> : body}
      {large && viz}
    </div>
  );
}

export interface IntelFeedProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Section heading on the left. */
  title?: React.ReactNode;
  /** Small block under the heading — usually a `SectionLabel`. */
  subtitle?: React.ReactNode;
  /** Right-hand cyan mono readout, e.g. "LIVE // UPDATED 4 MIN AGO". */
  status?: React.ReactNode;
  /** Show a pulsing dot before the status text. */
  pulse?: boolean;
}

/**
 * Header + 12-column grid for a set of `IntelCard`s. The status slot on the
 * right is where the site prints its live-feed readout.
 */
export function IntelFeed({
  title,
  subtitle,
  status,
  pulse = true,
  className,
  children,
  ...rest
}: IntelFeedProps) {
  return (
    <div className={cx("intel", className)} {...rest}>
      {(title || status || subtitle) && (
        <div className="intel-header">
          <div className="intel-title-block">
            {subtitle}
            {title && <div className="intel-title">{title}</div>}
          </div>
          {status && (
            <div className="intel-status">
              {pulse && <span className="panel-dot" aria-hidden />}
              {status}
            </div>
          )}
        </div>
      )}
      <div className="intel-grid">{children}</div>
    </div>
  );
}
