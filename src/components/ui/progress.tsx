import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  /** Visual variant for the 3D fill. */
  variant?: "primary" | "warm" | "cool" | "danger";
  indicatorClassName?: string;
}

/**
 * 3D progress bar: a sunken (inset) track with a glossy gradient fill,
 * a top highlight stripe, and a glow on the leading edge. Feels tactile.
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, variant = "primary", indicatorClassName, ...props }, ref) => {
    const pct = Math.min(100, Math.max(0, (value / (max || 1)) * 100));
    const fillClass =
      variant === "warm" ? "progress-3d-fill warm"
      : variant === "cool" ? "progress-3d-fill cool"
      : variant === "danger" ? "progress-3d-fill danger"
      : "progress-3d-fill";
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={max}
        className={cn("h-3 w-full overflow-hidden rounded-full progress-3d-track", className)}
        {...props}
      >
        <div
          className={cn(fillClass, "h-full rounded-full transition-[width] duration-700 ease-out", indicatorClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";

export { Progress };
