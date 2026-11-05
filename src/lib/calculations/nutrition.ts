import type { FoodItem, FoodLog, MealCategory } from "@/types";
import { round, safeDivide } from "@/lib/utils";

/**
 * Nutrition for a given grams quantity, scaled linearly from per-100g values.
 * `grams` must be a positive number; non-finite inputs yield zeros.
 */
export function nutritionForGrams(
  food: Pick<
    FoodItem,
    | "caloriesPer100g"
    | "proteinPer100g"
    | "carbsPer100g"
    | "fatPer100g"
    | "fiberPer100g"
  >,
  grams: number,
): { calories: number; protein: number; carbs: number; fat: number; fiber: number } {
  const factor = safeDivide(grams, 100);
  return {
    calories: round(food.caloriesPer100g * factor, 0),
    protein: round(food.proteinPer100g * factor, 1),
    carbs: round(food.carbsPer100g * factor, 1),
    fat: round(food.fatPer100g * factor, 1),
    fiber: round(food.fiberPer100g * factor, 1),
  };
}

/** Number of servings = grams / servingGrams. */
export function servingsForGrams(grams: number, servingGrams: number): number {
  return round(safeDivide(grams, servingGrams), 2);
}

export interface MealTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

/** Sum nutrition across a list of food logs for a given day. */
export function sumDailyNutrition(logs: FoodLog[]): MealTotals {
  return logs.reduce<MealTotals>(
    (acc, l) => ({
      calories: acc.calories + l.calories,
      protein: acc.protein + l.protein,
      carbs: acc.carbs + l.carbs,
      fat: acc.fat + l.fat,
      fiber: acc.fiber + l.fiber,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
}

/** Per-category breakdown for a day's logs. */
export function nutritionByMeal(
  logs: FoodLog[],
): Record<MealCategory, MealTotals> {
  const empty: MealTotals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const result: Record<MealCategory, MealTotals> = {
    breakfast: { ...empty },
    lunch: { ...empty },
    dinner: { ...empty },
    snacks: { ...empty },
  };
  for (const l of logs) {
    const bucket = result[l.mealCategory] ?? result.snacks;
    bucket.calories += l.calories;
    bucket.protein += l.protein;
    bucket.carbs += l.carbs;
    bucket.fat += l.fat;
    bucket.fiber += l.fiber;
  }
  // round
  (Object.keys(result) as MealCategory[]).forEach((k) => {
    result[k] = {
      calories: round(result[k].calories, 0),
      protein: round(result[k].protein, 1),
      carbs: round(result[k].carbs, 1),
      fat: round(result[k].fat, 1),
      fiber: round(result[k].fiber, 1),
    };
  });
  return result;
}

/**
 * Build a FoodLog entry from a FoodItem + quantity.
 * Centralizes the math so logging is consistent everywhere.
 */
export function buildFoodLog(params: {
  food: FoodItem;
  grams: number;
  date: string;
  mealCategory: MealCategory;
  mealTime?: string;
  priceINR?: number;
  notes?: string;
  id: string;
}): FoodLog {
  const { food, grams, date, mealCategory } = params;
  const n = nutritionForGrams(food, grams);
  return {
    id: params.id,
    date,
    mealCategory,
    foodItemId: food.id,
    foodName: food.name,
    quantityGrams: round(grams, 1),
    servings: servingsForGrams(grams, food.servingGrams),
    calories: n.calories,
    protein: n.protein,
    carbs: n.carbs,
    fat: n.fat,
    fiber: n.fiber,
    priceINR: params.priceINR,
    mealTime: params.mealTime,
    notes: params.notes,
    createdAt: new Date().toISOString(),
  };
}
