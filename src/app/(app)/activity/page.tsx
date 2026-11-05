"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Line,
  LineChart,
} from "recharts";
import { Plus, Trash2, Download, Upload, Footprints, Activity as ActivityIcon } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useWeeklySummaries } from "@/lib/store/use-daily-summary";
import { estimateActivityCalories, estimateSteps, estimateFloorsFromStairs, ACTIVITY_TYPE_LABELS } from "@/lib/calculations";
import { noopActivityProvider, toActivityCSV, parseActivityCSV } from "@/lib/providers/activity-provider";
import { uid, todayISO, toISODate, formatNumber, lastNDays } from "@/lib/utils";
import type { ActivityLog, ActivityType } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Dialog, DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { CHART_COLORS, axisTickStyle, gridProps, tooltipContentStyle, tooltipLabelStyle } from "@/components/shared/chart-helpers";

export default function ActivityPage() {
  const store = useDataStore();
  const weekly = useWeeklySummaries(7);
  const [logOpen, setLogOpen] = React.useState(false);
  const [period, setPeriod] = React.useState<"today" | "week">("today");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const targetDate = todayISO();
  const todayLogs = store.activityLogs.filter((l) => l.date === targetDate);
  const weekLogs = store.activityLogs.filter((l) => lastNDays(7).includes(l.date));

  const logs = period === "today" ? todayLogs : weekLogs;
  const shownLogs = period === "today" ? todayLogs : [...weekLogs].sort((a, b) => b.date.localeCompare(a.date));

  const totalSteps = todayLogs.reduce((s, l) => s + (l.steps ?? 0), 0);
  const totalDistance = todayLogs.reduce((s, l) => s + (l.distanceKm ?? 0), 0);
  const totalActive = todayLogs.reduce((s, l) => s + l.durationMin, 0);
  const totalCalories = todayLogs.reduce((s, l) => s + l.estimatedCaloriesBurned, 0);
  const totalFloors = todayLogs.reduce((s, l) => s + (l.floors ?? 0), 0);

  const stepsTarget = 8000;
  const weeklyAvgSteps = Math.round(weekly.reduce((s, d) => s + d.steps, 0) / (weekly.length || 1));

  const chartData = weekly.map((d) => ({
    date: d.date.slice(5),
    steps: d.steps,
    calories: d.caloriesBurnedActivity,
    minutes: d.activeMinutes,
  }));

  const exportCSV = () => {
    const csv = toActivityCSV(store.activityLogs);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "activity-logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = async (file: File) => {
    const text = await file.text();
    const parsed = parseActivityCSV(text);
    for (const p of parsed) {
      const weight = store.profile?.currentWeightKg ?? 70;
      store.addActivityLog({
        id: uid("act"),
        date: p.date!,
        type: p.type!,
        durationMin: p.durationMin!,
        distanceKm: p.distanceKm,
        steps: p.steps,
        floors: p.floors,
        intensity: p.intensity!,
        notes: p.notes,
        estimatedCaloriesBurned: estimateActivityCalories({ type: p.type!, durationMin: p.durationMin!, weightKg: weight, intensity: p.intensity }),
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Activity" description="Log walks, runs, cycling, gym and stairs. Manual entry + CSV import/export.">
        <Button onClick={() => setLogOpen(true)}><Plus className="h-4 w-4" /> Log activity</Button>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4" /> Export</Button>
        <Button variant="outline" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Import</Button>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCSV(f); e.target.value = ""; }} />
      </PageHeader>

      {/* Wearable note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
        This app does not automatically measure steps or floors. Manual entry and CSV import/export are the working options. A provider interface exists for future wearable/API integration (currently {noopActivityProvider.connected ? "connected" : "not connected"}).
      </div>

      {/* Today's totals */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Steps" value={formatNumber(totalSteps)} icon={Footprints} accent="primary" hint={`of ${formatNumber(stepsTarget)}`} />
        <StatCard label="Distance" value={formatNumber(totalDistance, 1)} unit="km" icon={Footprints} accent="blue" />
        <StatCard label="Active min" value={formatNumber(totalActive)} unit="min" icon={ActivityIcon} accent="amber" />
        <StatCard label="Floors" value={formatNumber(totalFloors)} icon={ActivityIcon} accent="purple" />
        <StatCard label="Calories burned" value={formatNumber(totalCalories)} unit="kcal" icon={ActivityIcon} accent="red" hint="Activity only (not BMR)" />
      </div>

      {/* Steps progress */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Today's steps goal</span>
            <span className="text-muted-foreground">{formatNumber(totalSteps)} / {formatNumber(stepsTarget)}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (totalSteps / stepsTarget) * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Weekly average: {formatNumber(weeklyAvgSteps)} steps/day</p>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Steps (7 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Bar dataKey="steps" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Activity calories (7 days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Line type="monotone" dataKey="calories" stroke={CHART_COLORS.red} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Log list */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Activity log</CardTitle>
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            <button onClick={() => setPeriod("today")} className={`rounded-md px-3 py-1 text-xs font-medium ${period === "today" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>Today</button>
            <button onClick={() => setPeriod("week")} className={`rounded-md px-3 py-1 text-xs font-medium ${period === "week" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>7 days</button>
          </div>
        </CardHeader>
        <CardContent>
          {shownLogs.length === 0 ? (
            <EmptyState icon={ActivityIcon} title="No activity logged" description="Log a walk, run, or workout to track your activity." action={<Button size="sm" onClick={() => setLogOpen(true)}><Plus className="h-4 w-4" /> Log activity</Button>} />
          ) : (
            <div className="space-y-2">
              {shownLogs.map((l) => (
                <ActivityRow key={l.id} log={l} showDate={period === "week"} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <LogActivityDialog open={logOpen} onOpenChange={setLogOpen} />
    </div>
  );
}

function ActivityRow({ log, showDate }: { log: ActivityLog; showDate: boolean }) {
  const store = useDataStore();
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{ACTIVITY_TYPE_LABELS[log.type]}</p>
          <Badge variant="secondary">{log.intensity}</Badge>
          {showDate && <span className="text-xs text-muted-foreground">{log.date}</span>}
        </div>
        <p className="text-xs text-muted-foreground">
          {log.durationMin} min{log.distanceKm ? ` · ${formatNumber(log.distanceKm, 1)} km` : ""}
          {log.steps ? ` · ${formatNumber(log.steps)} steps` : ""}
          {log.floors ? ` · ${log.floors} floors` : ""}
          {" · "}{formatNumber(log.estimatedCaloriesBurned)} kcal burned
        </p>
        {log.notes && <p className="mt-0.5 text-xs italic text-muted-foreground">"{log.notes}"</p>}
      </div>
      <Button variant="ghost" size="icon" onClick={() => store.deleteActivityLog(log.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </div>
  );
}

function LogActivityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const store = useDataStore();
  const [date, setDate] = React.useState(todayISO());
  const [type, setType] = React.useState<ActivityType>("walking");
  const [duration, setDuration] = React.useState("30");
  const [distance, setDistance] = React.useState("");
  const [steps, setSteps] = React.useState("");
  const [floors, setFloors] = React.useState("");
  const [intensity, setIntensity] = React.useState<"low" | "moderate" | "high">("moderate");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) { setDate(todayISO()); setType("walking"); setDuration("30"); setDistance(""); setSteps(""); setFloors(""); setIntensity("moderate"); setNotes(""); setError(""); }
  }, [open]);

  // auto-estimate steps from distance if empty
  React.useEffect(() => {
    if (distance && !steps && (type === "walking" || type === "running")) {
      setSteps(String(estimateSteps(Number(distance))));
    }
  }, [distance, type, steps]);

  // auto-estimate floors from stairs duration
  React.useEffect(() => {
    if (type === "stairs" && !floors && duration) {
      setFloors(String(estimateFloorsFromStairs(Number(duration))));
    }
  }, [type, duration, floors]);

  const calories = estimateActivityCalories({ type, durationMin: Number(duration) || 0, weightKg: store.profile?.currentWeightKg ?? 70, intensity });

  const save = () => {
    const d = Number(duration);
    if (!date || !Number.isFinite(d) || d <= 0) { setError("Enter a valid duration"); return; }
    store.addActivityLog({
      id: uid("act"),
      date,
      type,
      durationMin: d,
      distanceKm: distance ? Number(distance) : undefined,
      steps: steps ? Number(steps) : undefined,
      floors: floors ? Number(floors) : undefined,
      intensity,
      notes: notes || undefined,
      estimatedCaloriesBurned: calories,
      createdAt: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onOpenChange={onOpenChange} />
      <DialogHeader>
        <DialogTitle>Log activity</DialogTitle>
        <DialogDescription>Calories are estimated using METs. Real burn varies — treat as an estimate.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <Field label="Date" htmlFor="a-date"><Input id="a-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Activity" htmlFor="a-type">
            <Select id="a-type" value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
              {(Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[]).map((t) => <option key={t} value={t}>{ACTIVITY_TYPE_LABELS[t]}</option>)}
            </Select>
          </Field>
          <Field label="Duration (min)" htmlFor="a-dur" error={error}>
            <Input id="a-dur" type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Distance (km)" htmlFor="a-dist"><Input id="a-dist" type="number" step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="optional" /></Field>
          <Field label="Steps" htmlFor="a-steps"><Input id="a-steps" type="number" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="auto" /></Field>
          <Field label="Floors" htmlFor="a-floors"><Input id="a-floors" type="number" value={floors} onChange={(e) => setFloors(e.target.value)} placeholder="optional" /></Field>
        </div>
        <Field label="Intensity" htmlFor="a-int">
          <Select id="a-int" value={intensity} onChange={(e) => setIntensity(e.target.value as "low" | "moderate" | "high")}>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
          </Select>
        </Field>
        <Field label="Notes (optional)" htmlFor="a-notes"><Input id="a-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Morning walk in park" /></Field>
        <div className="rounded-lg border bg-muted/40 p-3 text-center">
          <p className="text-lg font-bold text-primary">{formatNumber(calories)} kcal</p>
          <p className="text-xs text-muted-foreground">estimated burn (activity only)</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save activity</Button>
        </div>
      </div>
    </Dialog>
  );
}
