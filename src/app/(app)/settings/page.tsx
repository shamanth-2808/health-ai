"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Save, RotateCcw, Trash2, Info, LogOut, ShieldCheck } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useAuth } from "@/lib/auth/auth-provider";
import { profileSchema } from "@/lib/validations";
import { ACTIVITY_LABELS } from "@/lib/calculations";
import type { ActivityLevel, DietaryPreference, FitnessGoal, FoodSource } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/shared/field";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const GOAL_LABELS: Record<FitnessGoal, string> = { fat_loss: "Fat Loss", maintenance: "Maintenance", muscle_gain: "Muscle Gain", general: "General Fitness" };
const DIET_LABELS: Record<DietaryPreference, string> = { vegetarian: "Vegetarian", vegan: "Vegan", eggetarian: "Eggetarian", non_vegetarian: "Non-Vegetarian" };
const SOURCE_LABELS: Record<FoodSource, string> = { home: "Home", grocery: "Grocery", restaurant: "Restaurant", swiggy: "Swiggy", zomato: "Zomato", custom: "Custom" };

export default function SettingsPage() {
  const router = useRouter();
  const store = useDataStore();
  const auth = useAuth();
  const [saved, setSaved] = React.useState(false);
  const [confirmClear, setConfirmClear] = React.useState(false);

  if (!store.profile) return null;
  const p = store.profile;

  const update = (patch: Partial<typeof p>) => {
    store.updateProfile(patch);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const numUpdate = (key: keyof typeof p) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value === "" ? undefined : Number(e.target.value);
    update({ [key]: v } as Partial<typeof p>);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Edit your profile, goals, and manage your data.">
        {saved && <Badge variant="success">Saved</Badge>}
      </PageHeader>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="s-name"><Input id="s-name" value={p.name} onChange={(e) => update({ name: e.target.value })} /></Field>
          <Field label="Age" htmlFor="s-age"><Input id="s-age" type="number" value={p.age} onChange={numUpdate("age")} /></Field>
          <Field label="Sex" htmlFor="s-sex">
            <Select id="s-sex" value={p.sex} onChange={(e) => update({ sex: e.target.value as "male" | "female" })}>
              <option value="male">Male</option><option value="female">Female</option>
            </Select>
          </Field>
          <Field label="Height (cm)" htmlFor="s-height"><Input id="s-height" type="number" value={p.heightCm} onChange={numUpdate("heightCm")} /></Field>
          <Field label="Current weight (kg)" htmlFor="s-cw"><Input id="s-cw" type="number" step="0.1" value={p.currentWeightKg} onChange={numUpdate("currentWeightKg")} /></Field>
          <Field label="Target weight (kg)" htmlFor="s-tw"><Input id="s-tw" type="number" step="0.1" value={p.targetWeightKg} onChange={numUpdate("targetWeightKg")} /></Field>
        </CardContent>
      </Card>

      {/* Goals */}
      <Card>
        <CardHeader><CardTitle className="text-base">Goals & activity</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Fitness goal" htmlFor="s-goal">
            <Select id="s-goal" value={p.fitnessGoal} onChange={(e) => update({ fitnessGoal: e.target.value as FitnessGoal })}>
              {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((g) => <option key={g} value={g}>{GOAL_LABELS[g]}</option>)}
            </Select>
          </Field>
          <Field label="Activity level" htmlFor="s-act">
            <Select id="s-act" value={p.activityLevel} onChange={(e) => update({ activityLevel: e.target.value as ActivityLevel })}>
              {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((a) => <option key={a} value={a}>{ACTIVITY_LABELS[a]}</option>)}
            </Select>
          </Field>
          <Field label="BMR equation" htmlFor="s-bmr">
            <Select id="s-bmr" value={p.bmrEquation} onChange={(e) => update({ bmrEquation: e.target.value as "mifflin_st_jeor" | "harris_benedict" })}>
              <option value="mifflin_st_jeor">Mifflin–St Jeor (recommended)</option>
              <option value="harris_benedict">Harris–Benedict (revised)</option>
            </Select>
          </Field>
          <Field label="Workout days / week" htmlFor="s-wd"><Input id="s-wd" type="number" min={0} max={7} value={p.workoutDaysPerWeek} onChange={numUpdate("workoutDaysPerWeek")} /></Field>
          <Field label="Training experience" htmlFor="s-exp">
            <Select id="s-exp" value={p.trainingExperience} onChange={(e) => update({ trainingExperience: e.target.value as typeof p.trainingExperience })}>
              <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
            </Select>
          </Field>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Gym access</label>
            <div className="flex h-10 gap-2">
              <button onClick={() => update({ gymAccess: true })} className={cn("h-10 flex-1 rounded-md border px-3 text-sm", p.gymAccess ? "border-primary bg-primary/10 text-primary" : "border-input bg-background")}>Yes</button>
              <button onClick={() => update({ gymAccess: false })} className={cn("h-10 flex-1 rounded-md border px-3 text-sm", !p.gymAccess ? "border-primary bg-primary/10 text-primary" : "border-input bg-background")}>No</button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diet & budget */}
      <Card>
        <CardHeader><CardTitle className="text-base">Diet & budget</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Dietary preference" htmlFor="s-diet">
              <Select id="s-diet" value={p.dietaryPreference} onChange={(e) => update({ dietaryPreference: e.target.value as DietaryPreference })}>
                {(Object.keys(DIET_LABELS) as DietaryPreference[]).map((d) => <option key={d} value={d}>{DIET_LABELS[d]}</option>)}
              </Select>
            </Field>
            <Field label="Daily food budget (₹)" htmlFor="s-budget"><Input id="s-budget" type="number" value={p.dailyFoodBudgetINR} onChange={numUpdate("dailyFoodBudgetINR")} /></Field>
          </div>
          <Field label="Allergies (comma-separated)" htmlFor="s-allergies">
            <Input id="s-allergies" value={p.allergies.join(", ")} onChange={(e) => update({ allergies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          </Field>
          <div>
            <label className="text-sm font-medium">Preferred food sources</label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(Object.keys(SOURCE_LABELS) as FoodSource[]).map((s) => {
                const active = p.preferredFoodSources.includes(s);
                return (
                  <button key={s} onClick={() => update({ preferredFoodSources: active ? p.preferredFoodSources.filter((x) => x !== s) : [...p.preferredFoodSources, s] })}
                    className={cn("rounded-full border px-3 py-1.5 text-sm", active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent")}>
                    {SOURCE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optional metrics */}
      <Card>
        <CardHeader><CardTitle className="text-base">Optional measurements</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Waist (cm)" htmlFor="s-waist"><Input id="s-waist" type="number" step="0.1" value={p.waistCm ?? ""} onChange={numUpdate("waistCm")} /></Field>
          <Field label="Target sleep (hours)" htmlFor="s-sleep"><Input id="s-sleep" type="number" step="0.1" value={p.sleepHours ?? ""} onChange={numUpdate("sleepHours")} /></Field>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {auth.supabaseAuthEnabled ? (
            auth.user ? (
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium">Signed in</p>
                  <p className="text-xs text-muted-foreground">{auth.user.email}</p>
                </div>
                <Button variant="outline" onClick={() => auth.signOut()}><LogOut className="h-4 w-4" /> Sign out</Button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium">Supabase connected</p>
                  <p className="text-xs text-muted-foreground">You're in demo mode. Sign in to sync your data.</p>
                </div>
                <Button variant="outline" onClick={() => router.push("/login")}>Sign in</Button>
              </div>
            )
          ) : (
            <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Demo mode — data is stored locally in this browser. Connect Supabase (see README) to enable account login and cross-device sync.</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data management */}
      <Card>
        <CardHeader><CardTitle className="text-base">Data management</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
            <div>
              <p className="font-medium text-sm">Load demo data</p>
              <p className="text-xs text-muted-foreground">Replace current data with clearly-labeled sample data for preview.</p>
            </div>
            <Button variant="outline" onClick={() => store.resetToDemo()}><RotateCcw className="h-4 w-4" /> Load demo</Button>
          </div>
          {!confirmClear ? (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium text-sm">Clear all data</p>
                <p className="text-xs text-muted-foreground">Removes all logs. Profile is reset. Sample prices are restored. Cannot be undone.</p>
              </div>
              <Button variant="destructive" onClick={() => setConfirmClear(true)}><Trash2 className="h-4 w-4" /> Clear</Button>
            </div>
          ) : (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-sm font-medium">Are you sure? This permanently deletes all your logs.</p>
              <div className="mt-3 flex gap-2">
                <Button variant="destructive" onClick={() => { store.clearAllData(); setConfirmClear(false); }}>Yes, clear everything</Button>
                <Button variant="outline" onClick={() => setConfirmClear(false)}>Cancel</Button>
              </div>
            </div>
          )}
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Data is stored locally in your browser (localStorage). With Supabase configured (see README), it syncs to your private, RLS-protected database. No personal data leaves your device in demo mode.</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
