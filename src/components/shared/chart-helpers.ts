/** Theme-aware chart color tokens (match CSS variables). */
export const CHART_COLORS = {
  primary: "hsl(var(--chart-1))",
  blue: "hsl(var(--chart-2))",
  amber: "hsl(var(--chart-3))",
  purple: "hsl(var(--chart-4))",
  red: "hsl(var(--chart-5))",
  muted: "hsl(var(--muted-foreground))",
  grid: "hsl(var(--border))",
};

export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.blue,
  CHART_COLORS.amber,
  CHART_COLORS.purple,
  CHART_COLORS.red,
];

export const axisTickStyle = {
  fontSize: 12,
  fill: "hsl(var(--muted-foreground))",
};

export const gridProps = {
  strokeDasharray: "3 3",
  stroke: CHART_COLORS.grid,
  vertical: false,
};

/** Style object for Recharts <Tooltip contentStyle={...} /> */
export const tooltipContentStyle = {
  backgroundColor: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  color: "hsl(var(--popover-foreground))",
  fontSize: "0.8rem",
} as const;

/** Style object for Recharts <Tooltip labelStyle={...} /> */
export const tooltipLabelStyle = {
  color: "hsl(var(--muted-foreground))",
  fontWeight: 600,
} as const;
