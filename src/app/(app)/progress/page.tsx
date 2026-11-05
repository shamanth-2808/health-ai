"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import { Plus, Trash2, Scale, TrendingDown, TrendingUp, Minus, Download, Target } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { calculateBMI, getBMICategory, healthyWeightRange, movingAverage, weightTrendDirection } from "@/lib/calculations/bmi";
import { uid, todayISO, toISODate, formatNumber, lastNDays } from "@/lib/utils";
import type { WeightLog } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { LogWeightDialog } from "@/components/dialogs/log-weight-dialog";
import { CHART_COLORS, axisTickStyle, gridProps, tooltipContentStyle, tooltipLabelStyle } from "@/components/shared/chart-helpers";

export default function ProgressPage() {
  const store = useDataStore();
  const [logOpen, setLogOpen] = React.useState(false);
  const [range, setRange] = React.useState<7 | 30 | 90>(30);

  if (!store.profile) return null;

  const sorted = [...store.weightLogs].sort((a, b) => a.date.localeCompare(b.date));
  const trend = weightTrendDirection(sorted);
  const current = sorted.length ? sorted[sorted.length - 1].weightKg : store.profile.currentWeightKg;
  const start = sorted.length ? sorted[0].weightKg : store.profile.currentWeightKg;
  const goal = store.profile.targetWeightKg;
  const totalChange = current - start;
  const goalDist = current - goal;
  const goalProgress = store.profile.currentWeightKg !== goal
    ? Math.min(100, Math.max(0, ((start - current) / (start - goal)) * 100))
    : 0;

  const bmi = calculateBMI(current, store.profile.heightCm);
  const cat = getBMICategory(bmi);
  const healthyRange = healthyWeightRange(store.profile.heightCm);

  // Filtered range
  const rangeDates = lastNDays(range);
  const inRange = sorted.filter((l) => rangeDates.includes(l.date));
  const weights = inRange.map((l) => l.weightKg);
  const smoothed = movingAverage(weights, 5);
  const chartData = inRange.map((l, i) => ({
    date: l.date.slice(5),
    weight: l.weightKg,
    trend: smoothed[i],
  }));

  const waistData = inRange.filter((l) => l.waistCm != null);

  const exportCSV = () => {
    const header = "date,weightKg,waistCm,notes";
    const rows = sorted.map((l) => [l.date, l.weightKg, l.waistCm ?? "", `"${(l.notes ?? "").replace(/"/g, '""')}"`].join(","));
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "weight-logs.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Weight & Progress" description="Track weight trends over time. Short-term changes aren't fat loss.">
        <Button onClick={() => setLogOpen(true)}><Plus className="h-4 w-4" /> Log weight</Button>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4" /> Export</Button>
      </PageHeader>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Current" value={formatNumber(current, 1)} unit="kg" icon={Scale} accent="primary" />
        <StatCard
          label="Total change"
          value={`${totalChange >= 0 ? "+" : ""}${formatNumber(totalChange, 1)}`}
          unit="kg"
          icon={totalChange < 0 ? TrendingDown : totalChange > 0 ? TrendingUp : Minus}
          accent={totalChange < 0 ? "green" : totalChange > 0 ? "red" : "primary"}
          hint={`from ${formatNumber(start, 1)} kg`}
        />
        <StatCard label="To goal" value={`${goalDist >= 0 ? "" : "+"}${formatNumber(Math.abs(goalDist), 1)}`} unit="kg" icon={Target} accent="blue" hint={`goal ${formatNumber(goal, 1)} kg`} />
        <StatCard label="BMI" value={formatNumber(bmi, 1)} icon={Scale} accent="purple" hint={cat.label} />
      </div>

      {/* Trend + goal progress */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Trend</CardTitle></CardHeader>
          <CardContent>
            <Badge variant={trend.direction === "down" ? "success" : trend.direction === "up" ? "destructive" : "secondary"}>
              {trend.direction === "down" ? "▼ Down" : trend.direction === "up" ? "▲ Up" : "— Stable"} {trend.deltaKg !== 0 ? `${Math.abs(trend.deltaKg)} kg` : ""}
            </Badge>
            <p className="mt-3 text-sm text-muted-foreground">
              Recent avg: {formatNumber(trend.recent, 1)} kg vs previous {formatNumber(trend.previous, 1)} kg.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Weight fluctuates daily due to water, glycogen, and sodium. Look at multi-week trends, not single days.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Goal progress</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-muted-foreground">{formatNumber(start, 1)} kg (start)</span>
              <span className="text-muted-foreground">{formatNumber(goal, 1)} kg (goal)</span>
            </div>
            <Progress value={goalProgress} />
            <p className="mt-2 text-sm font-medium">{formatNumber(goalProgress, 0)}% to goal</p>
            <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm">
              <p className="font-medium">Healthy weight range for your height</p>
              <p className="text-muted-foreground">{formatNumber(healthyRange.min, 1)}–{formatNumber(healthyRange.max, 1)} kg (BMI 18.5–24.9)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weight chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Weight chart</CardTitle>
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {([7, 30, 90] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`rounded-md px-3 py-1 text-xs font-medium ${range === r ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
                {r}d
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length < 2 ? (
            <EmptyState icon={Scale} title="Not enough data" description="Log your weight on a few days to see a trend chart." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={axisTickStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Area type="monotone" dataKey="weight" stroke={CHART_COLORS.primary} strokeWidth={1.5} fill="url(#wGrad)" dot={false} name="Daily" />
                <Line type="monotone" dataKey="trend" stroke={CHART_COLORS.blue} strokeWidth={2.5} dot={false} name="Trend (avg)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Log history */}
      <Card>
        <CardHeader><CardTitle className="text-base">Weight log</CardTitle></CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <EmptyState icon={Scale} title="No entries yet" description="Log your weight to start tracking." action={<Button size="sm" onClick={() => setLogOpen(true)}><Plus className="h-4 w-4" /> Log weight</Button>} />
          ) : (
            <div className="space-y-2">
              {[...sorted].reverse().map((l) => <WeightRow key={l.id} log={l} />)}
            </div>
          )}
        </CardContent>
      </Card>

      <LogWeightDialog open={logOpen} onOpenChange={setLogOpen} />
    </div>
  );
}

function WeightRow({ log }: { log: WeightLog }) {
  const store = useDataStore();
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2.5">
      <div>
        <p className="font-medium">{formatNumber(log.weightKg, 1)} kg{log.waistCm ? ` · waist ${formatNumber(log.waistCm, 1)}cm` : ""}</p>
        <p className="text-xs text-muted-foreground">{log.date}{log.notes ? ` · ${log.notes}` : ""}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => store.deleteWeightLog(log.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </div>
  );
}

