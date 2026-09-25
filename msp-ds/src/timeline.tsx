import * as React from "react";
import { cx } from "./util";

export interface ApproachPhase {
  /** Mono index, e.g. "PHASE 01". */
  num: string;
  /** Phase name. */
  title: string;
  /** One or two sentences on what happens in this phase. */
  desc: string;
  /** Light the phase marker with the cyan glow. */
  active?: boolean;
}

export interface ApproachTimelineProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Section heading above the timeline. */
  title?: React.ReactNode;
  /** Small block above the heading — usually a `SectionLabel`. */
  eyebrow?: React.ReactNode;
  /** Phases laid out left to right. Four across is the site's shape. */
  phases: ApproachPhase[];
}

/**
 * Horizontal process timeline — a hairline rule with a square cyan marker per
 * phase, each carrying a mono index, a title, and a description. Phases drop
 * to two-up at 1024px and stack at 640px.
 */
export function ApproachTimeline({
  title,
  eyebrow,
  phases,
  className,
  ...rest
}: ApproachTimelineProps) {
  return (
    <div className={cx("approach", className)} {...rest}>
      {(title || eyebrow) && (
        <div className="approach-header">
          {eyebrow}
          {title && <div className="approach-title">{title}</div>}
        </div>
      )}
      <div className="approach-timeline">
        {phases.map((p) => (
          <div key={p.num + p.title} className={cx("approach-phase", p.active && "active")}>
            <div className="approach-phase-num">{p.num}</div>
            <div className="approach-phase-title">{p.title}</div>
            <div className="approach-phase-desc">{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
