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
} from "recharts";
import {
  Dumbbell, Plus, Trash2, Play, Check, X as XIcon, TrendingUp, ChevronRight, Target, Award,
} from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useWeeklySummaries } from "@/lib/store/use-daily-summary";
import { generateWorkoutPlan, EXERCISE_LIBRARY, substituteFor } from "@/lib/demo-data/exercises";
import { estimateActivityCalories } from "@/lib/calculations";
import { uid, todayISO, formatNumber, lastNDays } from "@/lib/utils";
import type { Workout, WorkoutExercise, WorkoutSet, ExerciseTemplate } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Dialog, DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { CHART_COLORS, axisTickStyle, gridProps, tooltipContentStyle, tooltipLabelStyle } from "@/components/shared/chart-helpers";

export default function WorkoutsPage() {
  const store = useDataStore();
  const weekly = useWeeklySummaries(7);
  const [startOpen, setStartOpen] = React.useState(false);
  const [activeWorkout, setActiveWorkout] = React.useState<Workout | null>(null);

  const plan = React.useMemo(() => {
    if (!store.profile) return null;
    return generateWorkoutPlan({
      goal: store.profile.fitnessGoal,
      experience: store.profile.trainingExperience,
      gymAccess: store.profile.gymAccess,
      daysPerWeek: store.profile.workoutDaysPerWeek,
    });
  }, [store.profile]);

  const recentWorkouts = React.useMemo(
    () => [...store.workouts].sort((a, b) => b.date.localeCompare(a.date)),
    [store.workouts],
  );

  // Personal records: best load per exercise across history
  const prs = React.useMemo(() => {
    const map = new Map<string, { exercise: string; load: number; reps: number }>();
    for (const w of store.workouts) {
      for (const ex of w.exercises) {
        const best = Math.max(...ex.sets.filter((s) => s.completed).map((s) => s.loadKg), 0);
        if (best > 0) {
          const prev = map.get(ex.exerciseName);
          if (!prev || best > prev.load) map.set(ex.exerciseName, { exercise: ex.exerciseName, load: best, reps: ex.sets.find((s) => s.loadKg === best)?.reps ?? 0 });
        }
      }
    }
    return [...map.values()];
  }, [store.workouts]);

  const totalWorkouts = recentWorkouts.length;
  const totalCalories = weekly.reduce((s, d) => s + d.caloriesBurnedActivity, 0);
  const thisWeekWorkouts = store.workouts.filter((w) => lastNDays(7).includes(w.date)).length;

  const chartData = weekly.map((d) => ({ date: d.date.slice(5), calories: d.caloriesBurnedActivity }));

  const startWorkout = (dayName: string, exerciseIds: string[]) => {
    const exercises: WorkoutExercise[] = exerciseIds.map((id) => {
      const tmpl = EXERCISE_LIBRARY.find((e) => e.id === id)!;
      const sets: WorkoutSet[] = Array.from({ length: tmpl.defaultSets }, (_, i) => ({
        id: uid("set"),
        setNumber: i + 1,
        reps: parseInt(tmpl.defaultReps) || 10,
        loadKg: 0,
        completed: false,
      }));
      return { id: uid("we"), exerciseId: id, exerciseName: tmpl.name, sets };
    });
    setActiveWorkout({
      id: uid("wk"),
      date: todayISO(),
      planName: dayName,
      durationMin: 0,
      estimatedCaloriesBurned: 0,
      exercises,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    setStartOpen(false);
  };

  const finishWorkout = (startTime: number) => {
    if (!activeWorkout) return;
    const durationMin = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    const completedExercises = activeWorkout.exercises.map((ex) => ({ ...ex }));
    const calories = estimateActivityCalories({ type: "gym", durationMin, weightKg: store.profile?.currentWeightKg ?? 70, intensity: "moderate" });
    store.addWorkout({ ...activeWorkout, exercises: completedExercises, durationMin, estimatedCaloriesBurned: calories, completed: true });
    setActiveWorkout(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Workouts" description="Generated plans, exercise logging, and progressive overload.">
        <Button onClick={() => setStartOpen(true)}><Play className="h-4 w-4" /> Start workout</Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total workouts" value={formatNumber(totalWorkouts)} icon={Dumbbell} accent="primary" />
        <StatCard label="This week" value={formatNumber(thisWeekWorkouts)} icon={Target} accent="blue" hint={`of ${store.profile?.workoutDaysPerWeek ?? 3} planned`} />
        <StatCard label="Calories (7d)" value={formatNumber(totalCalories)} unit="kcal" icon={TrendingUp} accent="amber" />
        <StatCard label="PRs tracked" value={formatNumber(prs.length)} icon={Award} accent="purple" />
      </div>

      {/* Active workout session */}
      {activeWorkout && <ActiveWorkoutCard workout={activeWorkout} onUpdate={setActiveWorkout} onFinish={finishWorkout} onCancel={() => setActiveWorkout(null)} />}

      {/* Generated plan */}
      {plan && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{plan.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{plan.split} · {plan.description}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.days.map((day) => (
              <div key={day.name} className="rounded-lg border bg-muted/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-medium">{day.name}</p>
                  <Button size="sm" variant="outline" onClick={() => startWorkout(day.name, day.exercises)}>
                    <Play className="h-3.5 w-3.5" /> Start
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {day.exercises.map((id) => {
                    const ex = EXERCISE_LIBRARY.find((e) => e.id === id);
                    return <Badge key={id} variant="secondary">{ex?.name ?? id}</Badge>;
                  })}
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              Plan based on {store.profile?.trainingExperience} level, {store.profile?.gymAccess ? "gym" : "bodyweight"} access, {store.profile?.workoutDaysPerWeek} days/week.
              Update in Settings to regenerate. Avoid working through pain — see a professional for injuries.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Exercise library */}
      <Card>
        <CardHeader><CardTitle className="text-base">Exercise library</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {EXERCISE_LIBRARY.slice(0, 12).map((ex) => (
              <div key={ex.id} className="rounded-lg border px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{ex.name}</p>
                  <Badge variant="outline">{ex.equipment}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{ex.muscleGroup} · {ex.defaultSets}×{ex.defaultReps} · {ex.defaultRestSec}s rest</p>
                <p className="mt-1 text-xs text-muted-foreground">{ex.instructions}</p>
                {substituteFor(ex.id) && <p className="mt-1 text-xs italic text-primary">Easier: {substituteFor(ex.id)!.name}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts + History */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Workout calories (7d)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="date" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
                <Bar dataKey="calories" fill={CHART_COLORS.purple} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Personal records</CardTitle></CardHeader>
          <CardContent>
            {prs.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No PRs yet. Log sets with load to track progress.</p>
            ) : (
              <div className="space-y-2">
                {prs.map((pr) => (
                  <div key={pr.exercise} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span className="font-medium">{pr.exercise}</span>
                    <Badge variant="success">{pr.load}kg × {pr.reps}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader><CardTitle className="text-base">Workout history</CardTitle></CardHeader>
        <CardContent>
          {recentWorkouts.length === 0 ? (
            <EmptyState icon={Dumbbell} title="No workouts logged" description="Start a session to begin tracking sets, reps and PRs." />
          ) : (
            <div className="space-y-2">
              {recentWorkouts.slice(0, 10).map((w) => (
                <WorkoutHistoryRow key={w.id} workout={w} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <StartWorkoutDialog open={startOpen} onOpenChange={setStartOpen} plan={plan} onStart={startWorkout} />
    </div>
  );
}

function ActiveWorkoutCard({ workout, onUpdate, onFinish, onCancel }: { workout: Workout; onUpdate: (w: Workout) => void; onFinish: (startTime: number) => void; onCancel: () => void }) {
  const startTime = React.useRef(Date.now());
  return (
    <Card className="border-primary">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base flex items-center gap-2"><Dumbbell className="h-4 w-4 text-primary" /> {workout.planName}</CardTitle>
          <p className="text-xs text-muted-foreground">Log sets as you go. Tap the check when a set is done.</p>
        </div>
        <Badge variant="default">In progress</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {workout.exercises.map((ex, ei) => (
          <div key={ex.id} className="rounded-lg border p-3">
            <p className="mb-2 font-medium">{ex.exerciseName}</p>
            <div className="space-y-1.5">
              {ex.sets.map((set, si) => (
                <div key={set.id} className="flex items-center gap-2 text-sm">
                  <span className="w-6 text-muted-foreground">{si + 1}.</span>
                  <Input type="number" placeholder="kg" value={set.loadKg || ""} onChange={(e) => {
                    const sets = [...ex.sets]; sets[si] = { ...set, loadKg: Number(e.target.value) || 0 };
                    const exercises = [...workout.exercises]; exercises[ei] = { ...ex, sets };
                    onUpdate({ ...workout, exercises });
                  }} className="w-20" />
                  <span className="text-muted-foreground">×</span>
                  <Input type="number" placeholder="reps" value={set.reps || ""} onChange={(e) => {
                    const sets = [...ex.sets]; sets[si] = { ...set, reps: Number(e.target.value) || 0 };
                    const exercises = [...workout.exercises]; exercises[ei] = { ...ex, sets };
                    onUpdate({ ...workout, exercises });
                  }} className="w-20" />
                  <button
                    onClick={() => {
                      const sets = [...ex.sets]; sets[si] = { ...set, completed: !set.completed };
                      const exercises = [...workout.exercises]; exercises[ei] = { ...ex, sets };
                      onUpdate({ ...workout, exercises });
                    }}
                    className={`ml-auto flex h-8 w-8 items-center justify-center rounded-md border ${set.completed ? "border-success bg-success text-success-foreground" : "border-input hover:bg-accent"}`}
                    aria-label="Mark set complete"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}><XIcon className="h-4 w-4" /> Cancel</Button>
          <Button onClick={() => onFinish(startTime.current)}><Check className="h-4 w-4" /> Finish workout</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WorkoutHistoryRow({ workout }: { workout: Workout }) {
  const store = useDataStore();
  const totalVolume = workout.exercises.reduce((s, ex) => s + ex.sets.filter((x) => x.completed).reduce((ss, x) => ss + x.loadKg * x.reps, 0), 0);
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2.5">
      <div>
        <p className="font-medium">{workout.planName ?? "Workout"}</p>
        <p className="text-xs text-muted-foreground">{workout.date} · {workout.durationMin} min · {formatNumber(workout.estimatedCaloriesBurned)} kcal{totalVolume > 0 ? ` · ${formatNumber(totalVolume)}kg volume` : ""}</p>
      </div>
      <Button variant="ghost" size="icon" onClick={() => store.deleteWorkout(workout.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </div>
  );
}

function StartWorkoutDialog({ open, onOpenChange, plan, onStart }: { open: boolean; onOpenChange: (o: boolean) => void; plan: ReturnType<typeof generateWorkoutPlan> | null; onStart: (dayName: string, exercises: string[]) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onOpenChange={onOpenChange} />
      <DialogHeader>
        <DialogTitle>Start a workout</DialogTitle>
        <DialogDescription>Pick a day from your plan to begin logging.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        {plan?.days.map((day) => (
          <button key={day.name} onClick={() => onStart(day.name, day.exercises)} className="flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors hover:bg-accent">
            <div>
              <p className="font-medium">{day.name}</p>
              <p className="text-xs text-muted-foreground">{day.exercises.length} exercises</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
        {(!plan || plan.days.length === 0) && <p className="py-4 text-center text-sm text-muted-foreground">Complete onboarding to generate a plan.</p>}
      </div>
    </Dialog>
  );
}
