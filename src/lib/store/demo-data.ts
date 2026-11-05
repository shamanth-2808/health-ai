import type {
  ActivityLog,
  FoodLog,
  Profile,
  SleepLog,
  WaterLog,
  WeightLog,
  Workout,
} from "@/types";
import { SEED_FOODS } from "@/lib/demo-data/foods";
import { buildFoodLog, nutritionForGrams, estimateActivityCalories } from "@/lib/calculations";
import { lastNDays, uid, todayISO } from "@/lib/utils";

/**
 * Generate clearly-labeled DEMO data for first-time previews.
 * This is NOT real measurement data — it exists so the dashboard looks
 * populated before the user logs anything. It is overwritten as soon as
 * the user adds their own entries / completes onboarding.
 */

const DEMO_DAYS = 7;

export function createDemoProfile(): Profile {
  const now = new Date().toISOString();
  return {
    id: "demo-user",
    name: "Demo User",
    age: 28,
    sex: "male",
    heightCm: 172,
    currentWeightKg: 75,
    targetWeightKg: 70,
    activityLevel: "moderate",
    dietaryPreference: "non_vegetarian",
    allergies: [],
    fitnessGoal: "fat_loss",
    dailyFoodBudgetINR: 350,
    preferredFoodSources: ["home", "grocery"],
    gymAccess: true,
    trainingExperience: "beginner",
    workoutDaysPerWeek: 4,
    waistCm: 86,
    sleepHours: 7,
    bmrEquation: "mifflin_st_jeor",
    createdAt: now,
    updatedAt: now,
  };
}

export function createDemoFoodLogs(): FoodLog[] {
  const days = lastNDays(DEMO_DAYS);
  const logs: FoodLog[] = [];
  const find = (id: string) => SEED_FOODS.find((f) => f.id === id)!;

  const templates: { foodId: string; grams: number; category: FoodLog["mealCategory"]; price?: number }[] = [
    { foodId: "idli", grams: 120, category: "breakfast", price: 20 },
    { foodId: "sambar", grams: 150, category: "breakfast" },
    { foodId: "coconut_chutney", grams: 40, category: "breakfast" },
    { foodId: "rice_white", grams: 200, category: "lunch", price: 15 },
    { foodId: "dal_cooked", grams: 150, category: "lunch" },
    { foodId: "chicken_curry", grams: 200, category: "dinner", price: 60 },
    { foodId: "chapati", grams: 80, category: "dinner" },
    { foodId: "banana", grams: 118, category: "snacks" },
    { foodId: "egg_whole", grams: 100, category: "snacks", price: 14 },
  ];

  days.forEach((date, di) => {
    templates.forEach((t, ti) => {
      // skip a couple of items on later days to create natural variation
      if (di > 3 && ti === 8) return;
      const food = { ...find(t.foodId), isCustom: false, createdAt: undefined } as never;
      logs.push(
        buildFoodLog({
          food,
          grams: t.grams,
          date,
          mealCategory: t.category,
          priceINR: t.price,
          id: uid("log"),
        }),
      );
    });
  });

  return logs;
}

export function createDemoActivityLogs(): ActivityLog[] {
  const days = lastNDays(DEMO_DAYS);
  const logs: ActivityLog[] = [];
  days.forEach((date, i) => {
    // walking most days
    logs.push({
      id: uid("act"),
      date,
      type: "walking",
      durationMin: 30 + (i % 3) * 10,
      distanceKm: 2.5 + (i % 3) * 0.5,
      steps: 3500 + (i % 4) * 800,
      intensity: "moderate",
      estimatedCaloriesBurned: estimateActivityCalories({
        type: "walking",
        durationMin: 30 + (i % 3) * 10,
        weightKg: 75,
      }),
      createdAt: new Date().toISOString(),
    });
    if (i % 2 === 0) {
      logs.push({
        id: uid("act"),
        date,
        type: "stairs",
        durationMin: 10,
        floors: 8,
        intensity: "moderate",
        estimatedCaloriesBurned: estimateActivityCalories({
          type: "stairs",
          durationMin: 10,
          weightKg: 75,
        }),
        createdAt: new Date().toISOString(),
      });
    }
  });
  return logs;
}

export function createDemoWeightLogs(): WeightLog[] {
  const days = lastNDays(DEMO_DAYS);
  const logs: WeightLog[] = [];
  let weight = 76;
  days.forEach((date, i) => {
    // gentle downward drift with noise
    weight = +(weight - 0.15 + (Math.sin(i) * 0.3)).toFixed(1);
    logs.push({
      id: uid("wl"),
      date,
      weightKg: weight,
      waistCm: i === days.length - 1 ? 86 : undefined,
      createdAt: new Date().toISOString(),
    });
  });
  return logs;
}

export function createDemoWaterLogs(): WaterLog[] {
  const days = lastNDays(DEMO_DAYS);
  return days.map((date, i) => ({
    id: uid("water"),
    date,
    glasses: 6 + (i % 4),
    createdAt: new Date().toISOString(),
  }));
}

export function createDemoSleepLogs(): SleepLog[] {
  const days = lastNDays(DEMO_DAYS);
  const qualities: SleepLog["quality"][] = ["fair", "good", "good", "excellent", "poor", "good", "fair"];
  return days.map((date, i) => ({
    id: uid("sleep"),
    date,
    hours: 6.5 + (i % 3) * 0.5,
    quality: qualities[i % qualities.length],
    createdAt: new Date().toISOString(),
  }));
}

export function createDemoWorkouts(): Workout[] {
  const days = lastNDays(DEMO_DAYS).slice(0, 4);
  return days.map((date, i) => ({
    id: uid("wk"),
    date,
    planName: "Full Body Beginner",
    durationMin: 45,
    estimatedCaloriesBurned: estimateActivityCalories({
      type: "gym",
      durationMin: 45,
      weightKg: 75,
      intensity: "moderate",
    }),
    exercises: [],
    completed: true,
    createdAt: new Date().toISOString(),
  }));
}

export interface DemoDataBundle {
  profile: Profile;
  foodLogs: FoodLog[];
  activityLogs: ActivityLog[];
  weightLogs: WeightLog[];
  waterLogs: WaterLog[];
  sleepLogs: SleepLog[];
  workouts: Workout[];
}

export function createDemoData(): DemoDataBundle {
  return {
    profile: createDemoProfile(),
    foodLogs: createDemoFoodLogs(),
    activityLogs: createDemoActivityLogs(),
    weightLogs: createDemoWeightLogs(),
    waterLogs: createDemoWaterLogs(),
    sleepLogs: createDemoSleepLogs(),
    workouts: createDemoWorkouts(),
  };
}

/** Check whether today already has at least one user log (non-demo). */
export function hasLoggedToday(foodLogs: FoodLog[]): boolean {
  const today = todayISO();
  return foodLogs.some((l) => l.date === today);
}
