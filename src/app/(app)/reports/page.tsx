"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Download, FileBarChart } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useWeeklySummaries } from "@/lib/store/use-daily-summary";
import { sumDailyNutrition } from "@/lib/calculations/nutrition";
import { sumFoodSpending } from "@/lib/calculations/protein-cost";
import { lastNDays, formatNumber, formatINR, toISODate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CHART_COLORS, axisTickStyle, gridProps, tooltipContentStyle, tooltipLabelStyle } from "@/components/shared/chart-helpers";

type Period = 7 | 14 | 30 | 90;

export default function ReportsPage() {
  const store = useDataStore();
  const [period, setPeriod] = React.useState<Period>(30);
  const [tab, setTab] = React.useState<"nutrition" | "activity" | "weight" | "spending">("nutrition");

  const days = lastNDays(period);

  // Build per-day records
  const records = React.useMemo(() => days.map((date) => {
    const logs = store.foodLogs.filter((l) => l.date === date);
    const n = sumDailyNutrition(logs);
    const activity = store.activityLogs.filter((l) => l.date === date);
    const weight = store.weightLogs.find((w) => w.date === date)?.weightKg;
    return {
      date,
      dateShort: date.slice(5),
      calories: n.calories,
      protein: n.protein,
      carbs: n.carbs,
      fat: n.fat,
      fiber: n.fiber,
      steps: activity.reduce((s, l) => s + (l.steps ?? 0), 0),
      activeMin: activity.reduce((s, l) => s + l.durationMin, 0),
      caloriesBurned: activity.reduce((s, l) => s + l.estimatedCaloriesBurned, 0),
      weight,
      spend: sumFoodSpending(logs),
    };
  }), [days, store.foodLogs, store.activityLogs, store.weightLogs]);

  const totals = React.useMemo(() => records.reduce(
    (acc, r) => ({
      calories: acc.calories + r.calories,
      protein: acc.protein + r.protein,
      steps: acc.steps + r.steps,
      activeMin: acc.activeMin + r.activeMin,
      spend: acc.spend + r.spend,
    }),
    { calories: 0, protein: 0, steps: 0, activeMin: 0, spend: 0 },
  ), [records]);

  const avg = {
    calories: Math.round(totals.calories / (period || 1)),
    protein: Math.round(totals.protein / (period || 1)),
    steps: Math.round(totals.steps / (period || 1)),
    activeMin: Math.round(totals.activeMin / (period || 1)),
    spend: Math.round(totals.spend / (period || 1)),
  };

  const exportCSV = () => {
    const header = "date,calories,protein,carbs,fat,fiber,steps,activeMin,caloriesBurned,weight,spend";
    const rows = records.map((r) => [r.date, r.calories, r.protein, r.carbs, r.fat, r.fiber, r.steps, r.activeMin, r.caloriesBurned, r.weight ?? "", r.spend].join(","));
    const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `health-report-${period}d.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Analyze your nutrition, activity, weight and spending trends.">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {([7, 14, 30, 90] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`rounded-md px-3 py-1.5 text-xs font-medium ${period === p ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
              {p}d
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4" /> Export CSV</Button>
      </PageHeader>

      {/* Averages */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Avg calories" value={formatNumber(avg.calories)} unit="/day" icon={FileBarChart} accent="primary" />
        <StatCard label="Avg protein" value={formatNumber(avg.protein, 0)} unit="g/day" icon={FileBarChart} accent="blue" />
        <StatCard label="Avg steps" value={formatNumber(avg.steps)} unit="/day" icon={FileBarChart} accent="amber" />
        <StatCard label="Avg active min" value={formatNumber(avg.activeMin)} unit="/day" icon={FileBarChart} accent="purple" />
        <StatCard label="Avg spend" value={formatINR(avg.spend)} unit="/day" icon={FileBarChart} accent={avg.spend > (store.profile?.dailyFoodBudgetINR ?? 350) ? "red" : "green"} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {([
          ["nutrition", "Nutrition"], ["activity", "Activity"], ["weight", "Weight"], ["spending", "Spending"],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`rounded-md px-4 py-1.5 text-sm font-medium ${tab === key ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "nutrition" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Calories (daily)">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={records} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="dateShort" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Line type="monotone" dataKey="calories" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Protein (daily, g)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={records} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="dateShort" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Bar dataKey="protein" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Macros (daily)" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={records} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="dateShort" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Legend />
                <Bar dataKey="carbs" stackId="a" fill={CHART_COLORS.amber} name="Carbs (g)" />
                <Bar dataKey="protein" stackId="a" fill={CHART_COLORS.blue} name="Protein (g)" />
                <Bar dataKey="fat" stackId="a" fill={CHART_COLORS.purple} name="Fat (g)" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {tab === "activity" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Steps (daily)">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={records} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="dateShort" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Bar dataKey="steps" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Active minutes & calories burned">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={records} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="dateShort" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Legend />
                <Line type="monotone" dataKey="activeMin" stroke={CHART_COLORS.amber} strokeWidth={2} dot={false} name="Active min" />
                <Line type="monotone" dataKey="caloriesBurned" stroke={CHART_COLORS.red} strokeWidth={2} dot={false} name="Calories burned" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {tab === "weight" && (
        <ChartCard title="Weight trend (kg)">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={records} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="dateShort" tick={axisTickStyle} tickLine={false} axisLine={false} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={axisTickStyle} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
              <Line type="monotone" dataKey="weight" stroke={CHART_COLORS.purple} strokeWidth={2} connectNulls dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {tab === "spending" && (
        <ChartCard title="Daily food spending (₹)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={records} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="dateShort" tick={axisTickStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
              <Bar dataKey="spend" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-base">Daily breakdown</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Cal</TableHead>
                <TableHead className="text-right">Protein</TableHead>
                <TableHead className="text-right">Steps</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Weight</TableHead>
                <TableHead className="text-right">Spend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...records].reverse().map((r) => (
                <TableRow key={r.date}>
                  <TableCell>{r.date}</TableCell>
                  <TableCell className="text-right">{formatNumber(r.calories)}</TableCell>
                  <TableCell className="text-right">{formatNumber(r.protein, 1)}g</TableCell>
                  <TableCell className="text-right">{formatNumber(r.steps)}</TableCell>
                  <TableCell className="text-right">{r.activeMin}m</TableCell>
                  <TableCell className="text-right">{r.weight ? `${formatNumber(r.weight, 1)}kg` : "—"}</TableCell>
                  <TableCell className="text-right">{formatINR(r.spend)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
