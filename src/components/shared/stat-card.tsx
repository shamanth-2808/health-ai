import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// Restrained, tinted icon chips — no gradients. Each maps to a palette token.
const ACCENTS: Record<string, { chip: string; text: string }> = {
  primary: { chip: "bg-primary/12", text: "text-primary" },
  blue: { chip: "bg-accent/12", text: "text-accent" },
  amber: { chip: "bg-warning/15", text: "text-warning" },
  purple: { chip: "bg-chart-4/15", text: "text-chart-4" },
  red: { chip: "bg-destructive/12", text: "text-destructive" },
  green: { chip: "bg-success/12", text: "text-success" },
};

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  hint,
  trend,
  accent = "primary",
  className,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  icon?: LucideIcon;
  hint?: string;
  trend?: { value: string; positive?: boolean };
  accent?: "primary" | "blue" | "amber" | "purple" | "red" | "green";
  className?: string;
}) {
  const a = ACCENTS[accent] ?? ACCENTS.primary;
  return (
    <div className={cn("card-3d tilt-3d rounded-lg p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight tnum">
            {value}
            {unit && <span className="ml-1 text-xs font-medium text-muted-foreground">{unit}</span>}
          </p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          {trend && (
            <p className={cn("mt-1 text-xs font-semibold", trend.positive ? "text-success" : "text-destructive")}>
              {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-md", a.chip)}>
            <Icon className={cn("h-5 w-5", a.text)} />
          </div>
        )}
      </div>
    </div>
  );
}
