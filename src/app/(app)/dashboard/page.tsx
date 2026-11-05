"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Beef,
  Wheat,
  Droplet,
  Moon,
  Footprints,
  Scale,
  Wallet,
  TrendingDown,
  Plus,
  GlassWater,
  Dumbbell,
  UtensilsCrossed,
  Activity as ActivityIcon,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import { useDataStore } from "@/lib/store/data-store";
import { useDailySummary, useWeeklySummaries } from "@/lib/store/use-daily-summary";
import { weightTrendDirection } from "@/lib/calculations/bmi";
import { generateRuleBasedAdvice } from "@/lib/ai/rule-based";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AddFoodDialog } from "@/components/dialogs/add-food-dialog";
import { LogWeightDialog } from "@/components/dialogs/log-weight-dialog";
import { CHART_COLORS, axisTickStyle, gridProps, tooltipContentStyle, tooltipLabelStyle } from "@/components/shared/chart-helpers";
import { formatINR, formatNumber, toISODate } from "@/lib/utils";
import type { CoachContext } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const store = useDataStore();
  const { energyProfile, nutrition, activitySummary, waterGlasses, sleepHours, todayWeight, foodSpentINR, calorieTarget, proteinTarget, remainingCalories, remainingProtein, budgetRemaining } = useDailySummary();
  const weekly = useWeeklySummaries(7);

  const [foodDialog, setFoodDialog] = React.useState(false);
  const [weightDialog, setWeightDialog] = React.useState(false);

  if (!store.profile || !energyProfile) {
    return <div className="py-12 text-center text-muted-foreground">Loading your dashboard...</div>;
  }

  const trend = weightTrendDirection(store.weightLogs);
  const goal = store.profile.fitnessGoal;
  const weightProgress =
    store.profile && store.profile.targetWeightKg !== store.profile.currentWeightKg
      ? Math.min(100, Math.max(0, ((store.profile.currentWeightKg - trend.previous || store.profile.currentWeightKg) / Math.max(0.1, store.profile.currentWeightKg - store.profile.targetWeightKg)) * 100))
      : 0;

  const coachContext: CoachContext = {
    goal,
    calorieTarget,
    proteinTarget,
    caloriesConsumed: nutrition.calories,
    proteinConsumed: nutrition.protein,
    remainingCalories,
    remainingProtein,
    steps: activitySummary.steps,
    stepsTarget: 8000,
    waterGlasses,
    sleepHours,
    weightKg: todayWeight ?? store.profile.currentWeightKg,
    weightTrend: trend.direction,
    foodSpentINR,
    dailyBudgetINR: store.profile.dailyFoodBudgetINR,
    dietaryPreference: store.profile.dietaryPreference,
  };
  const advice = generateRuleBasedAdvice(coachContext);

  const chartData = weekly.map((d) => ({
    date: toISODate(new Date(d.date)).slice(5),
    calories: d.caloriesConsumed,
    protein: d.protein,
    steps: d.steps,
    weight: d.weightKg,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${store.profile.name || "there"}`}
        description="Here's your health snapshot for today."
      >
        <Badge variant={budgetRemaining >= 0 ? "success" : "destructive"}>
          {budgetRemaining >= 0 ? `${formatINR(budgetRemaining)} left` : `${formatINR(Math.abs(budgetRemaining))} over budget`}
        </Badge>
      </PageHeader>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <QuickAction icon={UtensilsCrossed} label="Add a meal" onClick={() => setFoodDialog(true)} />
        <QuickAction icon={Scale} label="Log weight" onClick={() => setWeightDialog(true)} />
        <QuickAction icon={GlassWater} label="+1 water" onClick={() => { store.addWater(new Date().toISOString().slice(0, 10), 1); }} />
        <QuickAction icon={ActivityIcon} label="Log activity" onClick={() => router.push("/activity")} />
        <QuickAction icon={Dumbbell} label="Start workout" onClick={() => router.push("/workouts")} />
      </div>

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Calories consumed"
          value={formatNumber(nutrition.calories)}
          unit={`/ ${formatNumber(calorieTarget)}`}
          icon={Flame}
          accent={remainingCalories < 0 ? "red" : "primary"}
          hint={remainingCalories < 0 ? `${formatNumber(Math.abs(remainingCalories))} over target` : `${formatNumber(remainingCalories)} remaining`}
        />
        <StatCard
          label="Protein"
          value={formatNumber(nutrition.protein, 1)}
          unit="g"
          icon={Beef}
          accent="blue"
          hint={`${formatNumber(Math.max(0, remainingProtein), 1)}g to target`}
        />
        <StatCard
          label="TDEE (estimated)"
          value={formatNumber(energyProfile.tdee)}
          unit="kcal"
          icon={TrendingDown}
          accent="purple"
          hint={`Activity: +${formatNumber(activitySummary.caloriesBurned)} kcal`}
        />
        <StatCard
          label="Food spent"
          value={formatINR(foodSpentINR)}
          icon={Wallet}
          accent={budgetRemaining < 0 ? "red" : "amber"}
          hint={`of ${formatINR(store.profile.dailyFoodBudgetINR)} budget`}
        />
      </div>

      {/* Energy detail row */}
      <Card>
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <EnergyBar label="Calories" value={nutrition.calories} target={calorieTarget} />
            <EnergyBar label="Protein (g)" value={nutrition.protein} target={proteinTarget} />
            <EnergyBar label="Carbs (g)" value={nutrition.carbs} target={(calorieTarget * 0.45) / 4} />
            <EnergyBar label="Fat (g)" value={nutrition.fat} target={(calorieTarget * 0.25) / 9} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4 text-center text-sm">
            <div>
              <p className="font-semibold">{formatNumber(energyProfile.bmr)} kcal</p>
              <p className="text-xs text-muted-foreground">BMR (resting)</p>
            </div>
            <div>
              <p className="font-semibold">{formatNumber(activitySummary.caloriesBurned)} kcal</p>
              <p className="text-xs text-muted-foreground">Activity calories</p>
            </div>
            <div>
              <p className="font-semibold">{formatNumber(energyProfile.totalDailyExpenditure)} kcal</p>
              <p className="text-xs text-muted-foreground">Total expenditure</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Steps" value={formatNumber(activitySummary.steps)} icon={Footprints} accent="primary" hint={`${formatNumber(activitySummary.distanceKm, 1)} km`} />
        <StatCard label="Active minutes" value={formatNumber(activitySummary.activeMinutes)} unit="min" icon={ActivityIcon} accent="blue" hint={`${activitySummary.floors} floors`} />
        <StatCard label="Water" value={waterGlasses} unit="glasses" icon={Droplet} accent="primary" hint="Target: 8" />
        <StatCard label="Sleep" value={sleepHours ? formatNumber(sleepHours, 1) : "—"} unit={sleepHours ? "h" : ""} icon={Moon} accent="purple" />
      </div>

      {/* Weight + Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2"><Scale className="h-4 w-4" /> Current weight</span>
              {trend.direction !== "stable" && (
                <Badge variant={trend.direction === "down" ? "success" : "destructive"}>
                  {trend.direction === "down" ? "▼" : "▲"} {Math.abs(trend.deltaKg)}kg
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatNumber(todayWeight ?? store.profile.currentWeightKg, 1)} <span className="text-base font-normal text-muted-foreground">kg</span></p>
            <p className="mt-1 text-sm text-muted-foreground">Goal: {formatNumber(store.profile.targetWeightKg, 1)} kg</p>
            <Progress value={goal === "muscle_gain" ? 100 - weightProgress : weightProgress} className="mt-3" />
            <p className="mt-2 text-xs text-muted-foreground">
              {trend.direction === "down"
                ? "Trending down — keep it up. Single-day changes aren't fat loss."
                : trend.direction === "up"
                  ? "Trending up — review your calorie balance."
                  : "Stable. Trends emerge over weeks, not days."}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Weekly calories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Area type="monotone" dataKey="calories" stroke={CHART_COLORS.primary} strokeWidth={2} fill="url(#calGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Protein (g)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Bar dataKey="protein" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Line type="monotone" dataKey="steps" stroke={CHART_COLORS.amber} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI daily summary */}
      <Card className="border-primary/30 bg-primary/[0.03]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" /> Daily summary & next actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{advice.summary}</p>
          <ul className="space-y-2">
            {advice.actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" onClick={() => router.push("/coach")}>
            Ask the AI coach <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>

      {/* Macros detail */}
      <Card>
        <CardHeader><CardTitle className="text-base">Today's macros</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Macro label="Protein" value={nutrition.protein} unit="g" color="text-chart-2" />
            <Macro label="Carbs" value={nutrition.carbs} unit="g" color="text-chart-3" />
            <Macro label="Fat" value={nutrition.fat} unit="g" color="text-chart-4" />
            <Macro label="Fiber" value={nutrition.fiber} unit="g" color="text-primary" />
          </div>
        </CardContent>
      </Card>

      <AddFoodDialog open={foodDialog} onOpenChange={setFoodDialog} />
      <LogWeightDialog open={weightDialog} onOpenChange={setWeightDialog} />
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 rounded-lg border bg-card p-4 text-center transition-all hover:border-primary/40 hover:bg-accent hover:shadow-sm"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function EnergyBar({ label, value, target }: { label: string; value: number; target: number }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{formatNumber(value, 0)} / {formatNumber(target, 0)}</span>
      </div>
      <Progress value={pct} indicatorClassName={pct > 100 ? "bg-destructive" : undefined} />
    </div>
  );
}

function Macro({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <p className={`text-xl font-bold ${color}`}>{formatNumber(value, 1)}</p>
      <p className="text-xs text-muted-foreground">{label} ({unit})</p>
    </div>
  );
}
