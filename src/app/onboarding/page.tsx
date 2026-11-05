"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  Check,
  User,
  Target,
  Activity,
  Salad,
  Moon,
} from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { profileSchema, type ProfileFormValues } from "@/lib/validations";
import type { Profile, ActivityLevel, FitnessGoal, DietaryPreference, FoodSource } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/shared/field";
import { Card } from "@/components/ui/card";
import { ACTIVITY_LABELS } from "@/lib/calculations";
import { uid } from "@/lib/utils";

const STEPS = [
  { id: "basics", label: "Basics", icon: User },
  { id: "goal", label: "Weight & Goal", icon: Target },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "diet", label: "Diet & Budget", icon: Salad },
  { id: "extras", label: "Optional", icon: Moon },
] as const;

const GOAL_LABELS: Record<FitnessGoal, string> = {
  fat_loss: "Fat Loss",
  maintenance: "Maintenance",
  muscle_gain: "Muscle Gain",
  general: "General Fitness",
};

const DIET_LABELS: Record<DietaryPreference, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  eggetarian: "Eggetarian (eggs, no meat)",
  non_vegetarian: "Non-Vegetarian",
};

const SOURCE_LABELS: Record<FoodSource, string> = {
  home: "Home-cooked",
  grocery: "Grocery",
  restaurant: "Restaurant",
  swiggy: "Swiggy",
  zomato: "Zomato",
  custom: "Custom",
};

export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding, profile, updateProfile } = useDataStore();
  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const [form, setForm] = React.useState<ProfileFormValues>(() => ({
    name: profile?.name ?? "",
    age: profile?.age ?? 28,
    sex: profile?.sex ?? "male",
    heightCm: profile?.heightCm ?? 172,
    currentWeightKg: profile?.currentWeightKg ?? 75,
    targetWeightKg: profile?.targetWeightKg ?? 70,
    activityLevel: (profile?.activityLevel ?? "moderate") as ActivityLevel,
    dietaryPreference: (profile?.dietaryPreference ?? "vegetarian") as DietaryPreference,
    allergies: profile?.allergies ?? [],
    fitnessGoal: (profile?.fitnessGoal ?? "general") as FitnessGoal,
    dailyFoodBudgetINR: profile?.dailyFoodBudgetINR ?? 350,
    preferredFoodSources: profile?.preferredFoodSources ?? (["home", "grocery"] as FoodSource[]),
    gymAccess: profile?.gymAccess ?? false,
    trainingExperience: profile?.trainingExperience ?? "beginner",
    workoutDaysPerWeek: profile?.workoutDaysPerWeek ?? 3,
    waistCm: profile?.waistCm,
    sleepHours: profile?.sleepHours ?? 7,
    bmrEquation: profile?.bmrEquation ?? "mifflin_st_jeor",
  }));

  const set = <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validateStep = (stepIndex: number): boolean => {
    const partial = profileSchema.partial();
    const fieldsByStep: Record<number, (keyof ProfileFormValues)[]> = {
      0: ["name", "age", "sex", "heightCm"],
      1: ["currentWeightKg", "targetWeightKg", "fitnessGoal"],
      2: ["activityLevel", "gymAccess", "trainingExperience", "workoutDaysPerWeek"],
      3: ["dietaryPreference", "dailyFoodBudgetINR", "preferredFoodSources"],
      4: [],
    };
    const fields = fieldsByStep[stepIndex] ?? [];
    const subset = Object.fromEntries(fields.map((k) => [k, form[k]]));
    const result = partial.safeParse(subset);
    if (result.success) {
      setErrors((e) => {
        const next = { ...e };
        fields.forEach((k) => delete next[k as string]);
        return next;
      });
      return true;
    }
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    setErrors((e) => ({ ...e, ...fieldErrors }));
    return false;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const submit = () => {
    const result = profileSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      // jump to first step with an error
      const stepWithError = STEPS.findIndex((_, i) => {
        const stepFields = [
          ["name", "age", "sex", "heightCm"],
          ["currentWeightKg", "targetWeightKg", "fitnessGoal"],
          ["activityLevel", "gymAccess", "trainingExperience", "workoutDaysPerWeek"],
          ["dietaryPreference", "dailyFoodBudgetINR", "preferredFoodSources"],
          [],
        ] as (keyof ProfileFormValues)[][];
        const fields = stepFields[i];
        return fields.some((f) => fieldErrors[f as string]);
      });
      if (stepWithError >= 0) setStep(stepWithError);
      return;
    }

    const v = result.data;
    const now = new Date().toISOString();
    const profileData: Profile = {
      id: profile?.id ?? uid("profile"),
      name: v.name,
      age: v.age,
      sex: v.sex,
      heightCm: v.heightCm,
      currentWeightKg: v.currentWeightKg,
      targetWeightKg: v.targetWeightKg,
      activityLevel: v.activityLevel,
      dietaryPreference: v.dietaryPreference,
      allergies: v.allergies ?? [],
      fitnessGoal: v.fitnessGoal,
      dailyFoodBudgetINR: v.dailyFoodBudgetINR,
      preferredFoodSources: v.preferredFoodSources,
      gymAccess: v.gymAccess,
      trainingExperience: v.trainingExperience,
      workoutDaysPerWeek: v.workoutDaysPerWeek,
      waistCm: v.waistCm,
      sleepHours: v.sleepHours,
      bmrEquation: v.bmrEquation,
      createdAt: profile?.createdAt ?? now,
      updatedAt: now,
    };
    completeOnboarding(profileData);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">Health AI</span>
        </div>

        {/* Progress steps */}
        <div className="mb-8 flex items-center justify-between gap-1">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex flex-1 flex-col items-center">
              <div
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors",
                  i < step
                    ? "border-primary bg-primary text-primary-foreground"
                    : i === step
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground",
                ].join(" ")}
              >
                {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
              </div>
              <span className={["mt-1.5 text-[11px] font-medium", i === step ? "text-foreground" : "text-muted-foreground"].join(" ")}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <Card className="p-6">
          {/* Step 0: Basics */}
          {step === 0 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold">Tell us about you</h2>
              <Field label="Your name" htmlFor="name" error={errors.name}>
                <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Arjun" />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age" htmlFor="age" error={errors.age}>
                  <Input id="age" type="number" value={form.age} onChange={(e) => set("age", Number(e.target.value))} />
                </Field>
                <Field label="Sex" htmlFor="sex" error={errors.sex} hint="Used for BMR calculation">
                  <Select id="sex" value={form.sex} onChange={(e) => set("sex", e.target.value as "male" | "female")}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </Select>
                </Field>
              </div>
              <Field label="Height (cm)" htmlFor="height" error={errors.heightCm}>
                <Input id="height" type="number" value={form.heightCm} onChange={(e) => set("heightCm", Number(e.target.value))} />
              </Field>
            </div>
          )}

          {/* Step 1: Weight & goal */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold">Weight & goal</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Current weight (kg)" htmlFor="cw" error={errors.currentWeightKg}>
                  <Input id="cw" type="number" step="0.1" value={form.currentWeightKg} onChange={(e) => set("currentWeightKg", Number(e.target.value))} />
                </Field>
                <Field label="Target weight (kg)" htmlFor="tw" error={errors.targetWeightKg}>
                  <Input id="tw" type="number" step="0.1" value={form.targetWeightKg} onChange={(e) => set("targetWeightKg", Number(e.target.value))} />
                </Field>
              </div>
              <Field label="Fitness goal" htmlFor="goal" error={errors.fitnessGoal}>
                <Select id="goal" value={form.fitnessGoal} onChange={(e) => set("fitnessGoal", e.target.value as FitnessGoal)}>
                  {(Object.keys(GOAL_LABELS) as FitnessGoal[]).map((g) => (
                    <option key={g} value={g}>{GOAL_LABELS[g]}</option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          {/* Step 2: Activity */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold">Activity & training</h2>
              <Field label="Activity level" htmlFor="activity" error={errors.activityLevel}>
                <Select id="activity" value={form.activityLevel} onChange={(e) => set("activityLevel", e.target.value as ActivityLevel)}>
                  {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((a) => (
                    <option key={a} value={a}>{ACTIVITY_LABELS[a]}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Training experience" htmlFor="exp">
                <Select id="exp" value={form.trainingExperience} onChange={(e) => set("trainingExperience", e.target.value as typeof form.trainingExperience)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Workout days / week" htmlFor="wd" error={errors.workoutDaysPerWeek}>
                  <Input id="wd" type="number" min={0} max={7} value={form.workoutDaysPerWeek} onChange={(e) => set("workoutDaysPerWeek", Number(e.target.value))} />
                </Field>
                <div className="space-y-1.5">
                  <Label>Gym access</Label>
                  <div className="flex h-10 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => set("gymAccess", true)}
                      className={["h-10 flex-1 rounded-md border px-3 text-sm", form.gymAccess ? "border-primary bg-primary/10 text-primary" : "border-input bg-background"].join(" ")}
                    >Yes</button>
                    <button
                      type="button"
                      onClick={() => set("gymAccess", false)}
                      className={["h-10 flex-1 rounded-md border px-3 text-sm", !form.gymAccess ? "border-primary bg-primary/10 text-primary" : "border-input bg-background"].join(" ")}
                    >No</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Diet & budget */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold">Diet & budget</h2>
              <Field label="Dietary preference" htmlFor="diet" error={errors.dietaryPreference}>
                <Select id="diet" value={form.dietaryPreference} onChange={(e) => set("dietaryPreference", e.target.value as DietaryPreference)}>
                  {(Object.keys(DIET_LABELS) as DietaryPreference[]).map((d) => (
                    <option key={d} value={d}>{DIET_LABELS[d]}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Allergies & restrictions" htmlFor="allergies" hint="Comma-separated, e.g. peanuts, lactose">
                <Input id="allergies" value={form.allergies.join(", ")} onChange={(e) => set("allergies", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="None" />
              </Field>
              <Field label="Daily food budget (₹)" htmlFor="budget" error={errors.dailyFoodBudgetINR}>
                <Input id="budget" type="number" value={form.dailyFoodBudgetINR} onChange={(e) => set("dailyFoodBudgetINR", Number(e.target.value))} />
              </Field>
              <Field label="Preferred food sources" error={errors.preferredFoodSources}>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(SOURCE_LABELS) as FoodSource[]).map((s) => {
                    const active = form.preferredFoodSources.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() =>
                          set(
                            "preferredFoodSources",
                            active ? form.preferredFoodSources.filter((x) => x !== s) : [...form.preferredFoodSources, s],
                          )
                        }
                        className={["rounded-full border px-3 py-1.5 text-sm transition-colors", active ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent"].join(" ")}
                      >
                        {SOURCE_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}

          {/* Step 4: Optional + BMR equation */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-lg font-semibold">Optional details</h2>
              <p className="text-sm text-muted-foreground">These improve accuracy but aren't required.</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Waist (cm)" htmlFor="waist" error={errors.waistCm}>
                  <Input id="waist" type="number" step="0.1" value={form.waistCm ?? ""} onChange={(e) => set("waistCm", e.target.value === "" ? undefined : Number(e.target.value))} />
                </Field>
                <Field label="Sleep (hours)" htmlFor="sleep" error={errors.sleepHours}>
                  <Input id="sleep" type="number" step="0.1" value={form.sleepHours ?? ""} onChange={(e) => set("sleepHours", e.target.value === "" ? undefined : Number(e.target.value))} />
                </Field>
              </div>
              <Field label="BMR equation" htmlFor="bmr" hint="Mifflin–St Jeor is recommended for most people">
                <Select id="bmr" value={form.bmrEquation} onChange={(e) => set("bmrEquation", e.target.value as "mifflin_st_jeor" | "harris_benedict")}>
                  <option value="mifflin_st_jeor">Mifflin–St Jeor (recommended)</option>
                  <option value="harris_benedict">Harris–Benedict (revised)</option>
                </Select>
              </Field>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button onClick={next}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={submit}>
                <Check className="h-4 w-4" /> Complete
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
