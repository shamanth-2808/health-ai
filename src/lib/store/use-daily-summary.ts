"use client";

import { useMemo } from "react";
import { useDataStore } from "@/lib/store/data-store";
import {
  buildEnergyProfile,
  sumDailyNutrition,
  nutritionByMeal,
  weeklyAverage,
} from "@/lib/calculations";
import { sumFoodSpending } from "@/lib/calculations/protein-cost";
import { todayISO, lastNDays } from "@/lib/utils";
import type { DailySummary, MealCategory } from "@/types";

export function useDailySummary(date?: string) {
  const store = useDataStore();
  const day = date ?? todayISO();

  const energyProfile = useMemo(() => {
    if (!store.profile) return null;
    const { age, sex, heightCm, currentWeightKg, activityLevel, fitnessGoal, bmrEquation } = store.profile;
    const activityCalories = store.activityLogs
      .filter((l) => l.date === day)
      .reduce((s, l) => s + l.estimatedCaloriesBurned, 0);
    return buildEnergyProfile({
      weightKg: currentWeightKg,
      heightCm,
      age,
      sex,
      activityLevel,
      goal: fitnessGoal,
      equation: bmrEquation,
      activityCalories,
    });
  }, [store.profile, store.activityLogs, day]);

  const dayFoodLogs = useMemo(
    () => store.foodLogs.filter((l) => l.date === day),
    [store.foodLogs, day],
  );

  const nutrition = useMemo(() => sumDailyNutrition(dayFoodLogs), [dayFoodLogs]);
  const byMeal = useMemo(() => nutritionByMeal(dayFoodLogs), [dayFoodLogs]);
  const foodSpentINR = useMemo(() => sumFoodSpending(dayFoodLogs), [dayFoodLogs]);

  const activitySummary = useMemo(() => {
    const logs = store.activityLogs.filter((l) => l.date === day);
    return {
      steps: logs.reduce((s, l) => s + (l.steps ?? 0), 0),
      distanceKm: logs.reduce((s, l) => s + (l.distanceKm ?? 0), 0),
      activeMinutes: logs.reduce((s, l) => s + l.durationMin, 0),
      floors: logs.reduce((s, l) => s + (l.floors ?? 0), 0),
      caloriesBurned: logs.reduce((s, l) => s + l.estimatedCaloriesBurned, 0),
    };
  }, [store.activityLogs, day]);

  const waterGlasses = useMemo(
    () => store.waterLogs.find((w) => w.date === day)?.glasses ?? 0,
    [store.waterLogs, day],
  );

  const sleepHours = useMemo(
    () => store.sleepLogs.find((s) => s.date === day)?.hours ?? 0,
    [store.sleepLogs, day],
  );

  const todayWeight = useMemo(
    () => store.weightLogs.find((w) => w.date === day)?.weightKg,
    [store.weightLogs, day],
  );

  return {
    energyProfile,
    nutrition,
    byMeal,
    dayFoodLogs,
    activitySummary,
    waterGlasses,
    sleepHours,
    todayWeight,
    foodSpentINR,
    calorieTarget: energyProfile?.calorieTarget ?? 2000,
    proteinTarget: energyProfile?.proteinTarget ?? 120,
    remainingCalories: (energyProfile?.calorieTarget ?? 2000) - nutrition.calories,
    remainingProtein: (energyProfile?.proteinTarget ?? 120) - nutrition.protein,
    budgetRemaining: (store.profile?.dailyFoodBudgetINR ?? 350) - foodSpentINR,
  };
}

/** Compute an array of daily summaries for the last N days (for charts). */
export function useWeeklySummaries(n = 7) {
  const store = useDataStore();

  return useMemo(() => {
    const days = lastNDays(n);
    return days.map((date): DailySummary & { totalExpenditure: number } => {
      const food = sumDailyNutrition(store.foodLogs.filter((l) => l.date === date));
      const activity = store.activityLogs.filter((l) => l.date === date);
      const caloriesBurnedActivity = activity.reduce((s, l) => s + l.estimatedCaloriesBurned, 0);
      const steps = activity.reduce((s, l) => s + (l.steps ?? 0), 0);
      const distanceKm = activity.reduce((s, l) => s + (l.distanceKm ?? 0), 0);
      const activeMinutes = activity.reduce((s, l) => s + l.durationMin, 0);
      const floors = activity.reduce((s, l) => s + (l.floors ?? 0), 0);
      const water = store.waterLogs.find((w) => w.date === date)?.glasses ?? 0;
      const sleep = store.sleepLogs.find((s) => s.date === date)?.hours ?? 0;
      const weight = store.weightLogs.find((w) => w.date === date)?.weightKg;
      const foodSpent = sumFoodSpending(store.foodLogs.filter((l) => l.date === date));
      let tdee = 2000;
      if (store.profile) {
        const { age, sex, heightCm, currentWeightKg, activityLevel, fitnessGoal, bmrEquation } = store.profile;
        const ep = buildEnergyProfile({
          weightKg: currentWeightKg,
          heightCm,
          age,
          sex,
          activityLevel,
          goal: fitnessGoal,
          equation: bmrEquation,
          activityCalories: caloriesBurnedActivity,
        });
        tdee = ep.totalDailyExpenditure;
      }
      return {
        date,
        caloriesConsumed: food.calories,
        caloriesBurnedActivity,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
        steps,
        distanceKm,
        activeMinutes,
        floors,
        waterGlasses: water,
        sleepHours: sleep,
        weightKg: weight,
        foodSpentINR: foodSpent,
        totalExpenditure: tdee,
      };
    });
  }, [store.foodLogs, store.activityLogs, store.waterLogs, store.sleepLogs, store.weightLogs, store.profile, n]);
}

export function useMealCategoryLogs(date: string, category: MealCategory) {
  const store = useDataStore();
  return useMemo(
    () => store.foodLogs.filter((l) => l.date === date && l.mealCategory === category),
    [store.foodLogs, date, category],
  );
}
