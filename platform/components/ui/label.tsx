import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "mono text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--on-surface-variant)]",
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = "Label";

export { Label };
