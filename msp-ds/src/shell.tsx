import * as React from "react";
import { cx } from "./util";

export interface AppShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Stretch to at least the full viewport height. */
  fullHeight?: boolean;
}

/**
 * Root wrapper that establishes the design system's ground: the dark navy
 * surface, the base text colour, Hanken Grotesk, and `color-scheme: dark` so
 * native controls and scrollbars render dark too.
 *
 * This system has no light mode. Every screen must be wrapped in one of these
 * (or sit on a host page that already paints `--background`), otherwise the
 * light `--on-surface` text renders on the browser's white default and is
 * effectively invisible.
 */
export function AppShell({
  fullHeight = false,
  className,
  style,
  children,
  ...rest
}: AppShellProps) {
  return (
    <div
      className={cx("app-shell", className)}
      style={{ minHeight: fullHeight ? "100vh" : undefined, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
