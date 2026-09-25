import * as React from "react";
import { cx } from "./util";

export interface ChatLauncherProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Hide the launcher — what the site does while the panel is open. */
  hidden?: boolean;
}

/**
 * Fixed bottom-right cyan pill that opens the chat panel. Carries the strong
 * cyan glow and deepens it on hover.
 */
export function ChatLauncher({ hidden = false, className, children, ...rest }: ChatLauncherProps) {
  return (
    <button
      type="button"
      className={cx("chatbot-launcher", hidden && "hidden", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export interface ChatMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * `user` is the cyan-tinted bubble on the right, `bot` the bordered bubble on
   * the left, `system` centred mono meta text with no bubble.
   */
  from?: "user" | "bot" | "system";
}

/**
 * One chat bubble. Alignment, background, and border all follow from `from`.
 */
export function ChatMessage({ from = "bot", className, children, ...rest }: ChatMessageProps) {
  return (
    <div className={cx("chatbot-msg", from, className)} {...rest}>
      {children}
    </div>
  );
}

export interface ChatTabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Light the tab cyan. */
  active?: boolean;
}

/**
 * Source-selector tab inside the chat panel — small mono chip that turns cyan
 * when active.
 */
export function ChatTab({ active = false, className, children, ...rest }: ChatTabProps) {
  return (
    <button type="button" className={cx("chatbot-tab", active && "active", className)} {...rest}>
      {children}
    </button>
  );
}

export interface ChatPanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Uppercase cyan mono title in the panel header. */
  title?: React.ReactNode;
  /** Whether the panel is shown. The fixed panel is hidden until opened. */
  open?: boolean;
  /**
   * Lay the panel out in normal document flow instead of pinning it to the
   * bottom-right of the viewport. Use inside cards and bounded containers.
   */
  docked?: boolean;
  /** Composer row at the bottom — usually a `ChatInput` and `ChatSend`. */
  footer?: React.ReactNode;
  /** Fine print under the composer. */
  meta?: React.ReactNode;
  /** Fired by the header's close button. */
  onClose?: () => void;
}

/**
 * The chat surface — 380x560 sunken panel with a bordered header, a scrolling
 * message body, and a composer footer. Pass `docked` to render it in flow.
 */
export function ChatPanel({
  title = "FinishLine Assistant",
  open = true,
  docked = false,
  footer,
  meta,
  onClose,
  className,
  children,
  ...rest
}: ChatPanelProps) {
  return (
    <div
      className={cx("chatbot-panel", open && "open", docked && "docked", className)}
      {...rest}
    >
      <div className="chatbot-head">
        <span className="chatbot-head-title">{title}</span>
        <button type="button" className="chatbot-close" onClick={onClose} aria-label="Close chat">
          ×
        </button>
      </div>
      <div className="chatbot-body">{children}</div>
      {footer && <div className="chatbot-foot">{footer}</div>}
      {meta && <div className="chatbot-meta">{meta}</div>}
    </div>
  );
}

/**
 * Composer text input for the chat panel — smaller than the form input, on the
 * darkest surface, cyan border on focus.
 */
export const ChatInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={cx("chatbot-input", className)} {...rest} />
  ),
);
ChatInput.displayName = "ChatInput";

/**
 * Send button for the chat composer — compact solid cyan, mono, uppercase.
 */
export const ChatSend = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, type = "button", children, ...rest }, ref) => (
    <button ref={ref} type={type} className={cx("chatbot-send", className)} {...rest}>
      {children}
    </button>
  ),
);
ChatSend.displayName = "ChatSend";
