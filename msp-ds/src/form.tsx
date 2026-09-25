import * as React from "react";
import { cx } from "./util";

/**
 * Vertical form stack with the system's 20px rhythm. Wrap every field,
 * row, and submit button in one of these.
 */
export function Form({ className, children, ...rest }: React.FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form className={cx("contact-form", className)} {...rest}>
      {children}
    </form>
  );
}

/**
 * Two-up field row that collapses to a single column below 640px. Give a child
 * `FormField` the `full` prop to make it span both columns.
 */
export function FormRow({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("form-row", className)} {...rest}>
      {children}
    </div>
  );
}

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Uppercase mono label above the control. */
  label?: React.ReactNode;
  /** `id` of the control, wired to the label's `htmlFor`. */
  htmlFor?: string;
  /** Span both columns of a `FormRow`. */
  full?: boolean;
}

/**
 * Label-over-control pairing — the only way fields are assembled on this site.
 * Put an input, select, or textarea inside as the child.
 */
export function FormField({
  label,
  htmlFor,
  full = false,
  className,
  children,
  ...rest
}: FormFieldProps) {
  return (
    <div className={cx("form-field", full && "full", className)} {...rest}>
      {label && (
        <label className="form-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
    </div>
  );
}

/**
 * Uppercase mono field label. `FormField` renders one for you — reach for this
 * directly only when you are assembling a field by hand.
 */
export function FormLabel({ className, children, ...rest }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cx("form-label", className)} {...rest}>
      {children}
    </label>
  );
}

/**
 * Text input on the darkest surface with a hairline border that turns cyan on
 * focus. Full width by default.
 */
export const FormInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={cx("form-input", className)} {...rest} />
  ),
);
FormInput.displayName = "FormInput";

/**
 * Select styled to match the text input, with the system's own grey caret
 * drawn in the right margin. Native chrome is suppressed.
 */
export const FormSelect = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...rest }, ref) => (
    <select ref={ref} className={cx("form-select", className)} {...rest}>
      {children}
    </select>
  ),
);
FormSelect.displayName = "FormSelect";

/**
 * Multi-line input, vertically resizable, 100px minimum (120px inside a
 * `Form`). Same focus treatment as the text input.
 */
export const FormTextarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...rest }, ref) => (
    <textarea ref={ref} className={cx("form-textarea", className)} {...rest} />
  ),
);
FormTextarea.displayName = "FormTextarea";

/**
 * Solid cyan submit button — uppercase mono, left-aligned in the stack, glows
 * on hover and dims to half opacity when disabled.
 */
export const FormSubmit = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, type = "submit", children, ...rest }, ref) => (
    <button ref={ref} type={type} className={cx("form-submit", className)} {...rest}>
      {children}
    </button>
  ),
);
FormSubmit.displayName = "FormSubmit";

/**
 * Fine print under a form — 11px mono in the muted outline colour. Used for
 * response-time promises and privacy notes.
 */
export function FormNote({ className, children, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cx("form-note", className)} {...rest}>
      {children}
    </p>
  );
}

/**
 * Off-screen honeypot field. Real users never see it; bots fill it, and the
 * submit handler drops any payload where it is non-empty.
 */
export function FormHoneypot({ name = "company_website" }: { name?: string }) {
  return (
    <div className="form-honey" aria-hidden>
      <label htmlFor={name}>Leave this field empty</label>
      <input id={name} name={name} type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

export interface FormThanksProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Large cyan mono glyph above the title. */
  icon?: React.ReactNode;
  /** Confirmation heading. */
  title?: React.ReactNode;
  /** Confirmation body copy. */
  desc?: React.ReactNode;
  /** Whether the state is showing. Hidden by default, matching the live markup. */
  visible?: boolean;
}

/**
 * Post-submit confirmation state — centred glyph, heading, and copy. Renders
 * its own panel chrome unless it sits inside a `ContactPanel`, where it drops
 * the border and background.
 */
export function FormThanks({
  icon = "✓",
  title = "Request received",
  desc,
  visible = true,
  className,
  children,
  ...rest
}: FormThanksProps) {
  return (
    <div className={cx("form-thanks", visible && "visible", className)} {...rest}>
      {icon && <div className="form-thanks-icon">{icon}</div>}
      {title && <div className="form-thanks-title">{title}</div>}
      {desc && <div className="form-thanks-desc">{desc}</div>}
      {children}
    </div>
  );
}
