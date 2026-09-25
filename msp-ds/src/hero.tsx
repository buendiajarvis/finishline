import * as React from "react";
import { cx } from "./util";

export interface HeroProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /** Uppercase cyan mono line above the headline, e.g. "Managed IT // Always On". */
  eyebrow?: React.ReactNode;
  /** Show the pulsing cyan square before the eyebrow text. */
  pulse?: boolean;
  /** The headline. Wrap the accented words in `<span>` to paint them cyan. */
  title: React.ReactNode;
  /** Supporting paragraph under the headline, capped at 540px. */
  subtitle?: React.ReactNode;
  /** Buttons and links laid out in a wrapping row below the subtitle. */
  actions?: React.ReactNode;
  /** Source for the muted background video that sits behind the copy. */
  videoSrc?: string;
  /** Poster frame for the background video. */
  videoPoster?: string;
}

/**
 * Top-of-page hero — eyebrow, oversized display headline, supporting
 * paragraph, and an action row, laid out on the left seven columns. Pass
 * `videoSrc` to run the darkened background video the marketing site uses.
 */
export function Hero({
  eyebrow,
  pulse = false,
  title,
  subtitle,
  actions,
  videoSrc,
  videoPoster,
  className,
  children,
  ...rest
}: HeroProps) {
  return (
    <section className={cx("hero", className)} {...rest}>
      {videoSrc && (
        <>
          <video
            className="hero-video"
            src={videoSrc}
            poster={videoPoster}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden
          />
          <div className="hero-video-overlay" aria-hidden />
        </>
      )}
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            {eyebrow && (
              <div className="hero-eyebrow">
                {pulse && <span className="panel-dot" aria-hidden />}
                {eyebrow}
              </div>
            )}
            <h1 className="hero-title">{title}</h1>
            {subtitle && <p className="hero-subtitle">{subtitle}</p>}
            {actions && <div className="hero-actions">{actions}</div>}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
