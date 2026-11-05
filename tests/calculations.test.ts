import { describe, expect, it } from "vitest";
import {
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateProteinTarget,
  isCalorieTargetUnsafe,
  buildEnergyProfile,
  ACTIVITY_MULTIPLIERS,
} from "@/lib/calculations/bmr-tdee";
import {
  calculateBMI,
  getBMICategory,
  healthyWeightRange,
  movingAverage,
  weightTrendDirection,
} from "@/lib/calculations/bmi";
import {
  nutritionForGrams,
  servingsForGrams,
  sumDailyNutrition,
  nutritionByMeal,
  buildFoodLog,
} from "@/lib/calculations/nutrition";
import {
  estimateActivityCalories,
  estimateSteps,
  MET_VALUES,
} from "@/lib/calculations/activity";
import { dailyEnergyBalance, weeklyAverage } from "@/lib/calculations/energy-balance";
import {
  computeProteinCost,
  costForTargetProtein,
  rankProteinOptions,
  cheapestProteinCombination,
  quantityToGrams,
  sumFoodSpending,
} from "@/lib/calculations/protein-cost";
import type { FoodPrice } from "@/types";

// ── BMR / TDEE ───────────────────────────────────────────────

describe("calculateBMR (Mifflin–St Jeor)", () => {
  it("computes BMR for a 30yo male", () => {
    // 10*70 + 6.25*175 - 5*30 + 5 = 700 + 1093.75 - 150 + 5 = 1648.75 → 1649
    const bmr = calculateBMR({ weightKg: 70, heightCm: 175, age: 30, sex: "male" });
    expect(bmr).toBe(1649);
  });

  it("computes BMR for a 28yo female", () => {
    // 10*60 + 6.25*162 - 5*28 - 161 = 600 + 1012.5 - 140 - 161 = 1311.5 → 1312
    const bmr = calculateBMR({ weightKg: 60, heightCm: 162, age: 28, sex: "female" });
    expect(bmr).toBe(1312);
  });

  it("Harris–Benedict differs from Mifflin", () => {
    const mifflin = calculateBMR({ weightKg: 70, heightCm: 175, age: 30, sex: "male" });
    const harris = calculateBMR({
      weightKg: 70, heightCm: 175, age: 30, sex: "male", equation: "harris_benedict",
    });
    expect(harris).not.toBe(mifflin);
    expect(harris).toBeGreaterThan(1600);
  });
});

describe("calculateTDEE", () => {
  it("applies the correct activity multiplier", () => {
    const tdee = calculateTDEE(1649, "moderate");
    expect(tdee).toBe(Math.round(1649 * ACTIVITY_MULTIPLIERS.moderate));
  });

  it("defaults to sedentary multiplier for unknown levels", () => {
    // @ts-expect-error testing unknown level
    const tdee = calculateTDEE(1600, "unknown");
    expect(tdee).toBe(Math.round(1600 * 1.2));
  });
});

describe("calculateCalorieTarget", () => {
  it("fat loss subtracts a 500 deficit", () => {
    expect(calculateCalorieTarget({ tdee: 2500, goal: "fat_loss", sex: "male" })).toBe(2000);
  });

  it("muscle gain adds a 300 surplus", () => {
    expect(calculateCalorieTarget({ tdee: 2500, goal: "muscle_gain", sex: "male" })).toBe(2800);
  });

  it("maintenance equals TDEE", () => {
    expect(calculateCalorieTarget({ tdee: 2500, goal: "maintenance", sex: "female" })).toBe(2500);
  });

  it("never drops below the female floor of 1200", () => {
    const t = calculateCalorieTarget({ tdee: 1400, goal: "fat_loss", sex: "female" });
    expect(t).toBeGreaterThanOrEqual(1200);
  });

  it("never drops below the male floor of 1500", () => {
    const t = calculateCalorieTarget({ tdee: 1700, goal: "fat_loss", sex: "male" });
    expect(t).toBeGreaterThanOrEqual(1500);
  });
});

describe("calculateProteinTarget", () => {
  it("muscle gain ~2.0 g/kg of reference weight", () => {
    const p = calculateProteinTarget({ weightKg: 70, heightCm: 175, goal: "muscle_gain" });
    // reference weight = min(70, 25*1.75^2=76.6) = 70 → 70*2 = 140
    expect(p).toBe(140);
  });

  it("uses adjusted weight for high BMI", () => {
    // height 175 → bmi25 weight ~76.6; actual 95 → use 76.6 * 1.6 ≈ 122.6 → 123
    const p = calculateProteinTarget({ weightKg: 95, heightCm: 175, goal: "fat_loss" });
    expect(p).toBeLessThan(95 * 1.6);
    expect(p).toBeGreaterThan(100);
  });
});

describe("isCalorieTargetUnsafe", () => {
  it("flags targets >30% below TDEE", () => {
    const r = isCalorieTargetUnsafe(1500, 2500);
    expect(r.unsafe).toBe(true);
  });

  it("passes safe targets", () => {
    expect(isCalorieTargetUnsafe(2000, 2500).unsafe).toBe(false);
  });
});

describe("buildEnergyProfile", () => {
  it("keeps activity calories separate from TDEE", () => {
    const profile = buildEnergyProfile({
      weightKg: 70, heightCm: 175, age: 30, sex: "male",
      activityLevel: "moderate", goal: "fat_loss", activityCalories: 400,
    });
    expect(profile.activityCalories).toBe(400);
    // total expenditure = TDEE + activity, NOT tdee + activity + bmr again
    expect(profile.totalDailyExpenditure).toBe(profile.tdee + 400);
  });
});

// ── BMI ───────────────────────────────────────────────────────

describe("calculateBMI", () => {
  it("computes BMI correctly", () => {
    // 70 / 1.75^2 = 22.86
    expect(calculateBMI(70, 175)).toBe(22.9);
  });

  it("returns 0 for zero height", () => {
    expect(calculateBMI(70, 0)).toBe(0);
  });
});

describe("getBMICategory", () => {
  it("classifies normal weight", () => {
    expect(getBMICategory(22.9).label).toBe("Normal");
  });
  it("classifies overweight", () => {
    expect(getBMICategory(27).label).toBe("Overweight");
  });
  it("classifies obese", () => {
    expect(getBMICategory(32).label).toBe("Obese");
  });
});

describe("healthyWeightRange", () => {
  it("returns 18.5–24.9 × height(m)^2", () => {
    const r = healthyWeightRange(175);
    // 18.5 × 1.75² = 56.656 → 56.7 ; 24.9 × 1.75² = 76.256 → 76.3
    expect(r.min).toBe(56.7);
    expect(r.max).toBe(76.3);
  });
});

describe("movingAverage", () => {
  it("smooths a series", () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toEqual([1.5, 2, 3, 4, 4.5]);
  });
  it("handles empty input", () => {
    expect(movingAverage([], 3)).toEqual([]);
  });
});

describe("weightTrendDirection", () => {
  it("detects a downward trend", () => {
    const logs = [
      { id: "1", date: "2026-01-01", weightKg: 80, createdAt: "" },
      { id: "2", date: "2026-01-02", weightKg: 79.5, createdAt: "" },
      { id: "3", date: "2026-01-03", weightKg: 79, createdAt: "" },
      { id: "4", date: "2026-01-04", weightKg: 78.5, createdAt: "" },
      { id: "5", date: "2026-01-05", weightKg: 78, createdAt: "" },
      { id: "6", date: "2026-01-06", weightKg: 77.5, createdAt: "" },
    ];
    const t = weightTrendDirection(logs);
    expect(t.direction).toBe("down");
    expect(t.deltaKg).toBeLessThan(0);
  });
});

// ── Nutrition ─────────────────────────────────────────────────

describe("nutritionForGrams", () => {
  it("scales nutrition linearly by grams", () => {
    const n = nutritionForGrams(
      { caloriesPer100g: 200, proteinPer100g: 10, carbsPer100g: 30, fatPer100g: 5, fiberPer100g: 2 },
      250,
    );
    expect(n.calories).toBe(500);
    expect(n.protein).toBe(25);
    expect(n.carbs).toBe(75);
    expect(n.fat).toBe(12.5);
    expect(n.fiber).toBe(5);
  });

  it("returns zeros for zero grams", () => {
    const n = nutritionForGrams(
      { caloriesPer100g: 200, proteinPer100g: 10, carbsPer100g: 30, fatPer100g: 5, fiberPer100g: 2 },
      0,
    );
    expect(n.calories).toBe(0);
  });
});

describe("servingsForGrams", () => {
  it("divides grams by serving size", () => {
    expect(servingsForGrams(200, 100)).toBe(2);
    expect(servingsForGrams(150, 100)).toBe(1.5);
  });
  it("returns 0 for zero serving", () => {
    expect(servingsForGrams(100, 0)).toBe(0);
  });
});

describe("sumDailyNutrition + nutritionByMeal", () => {
  const logs = [
    { id: "1", date: "2026-01-01", mealCategory: "breakfast", foodItemId: "f", foodName: "x", quantityGrams: 100, servings: 1, calories: 300, protein: 10, carbs: 40, fat: 5, fiber: 3, createdAt: "" },
    { id: "2", date: "2026-01-01", mealCategory: "lunch", foodItemId: "f", foodName: "x", quantityGrams: 100, servings: 1, calories: 500, protein: 20, carbs: 50, fat: 10, fiber: 4, createdAt: "" },
  ] as never;

  it("sums totals across meals", () => {
    const t = sumDailyNutrition(logs);
    expect(t.calories).toBe(800);
    expect(t.protein).toBe(30);
  });

  it("groups by meal category", () => {
    const byMeal = nutritionByMeal(logs);
    expect(byMeal.breakfast.calories).toBe(300);
    expect(byMeal.lunch.calories).toBe(500);
    expect(byMeal.dinner.calories).toBe(0);
  });
});

describe("buildFoodLog", () => {
  it("builds a log with computed nutrition", () => {
    const food = {
      id: "idli", name: "Idli", category: "breakfast",
      caloriesPer100g: 130, proteinPer100g: 3, carbsPer100g: 27, fatPer100g: 0.5, fiberPer100g: 1,
      servingName: "1 idli", servingGrams: 40,
      isVegetarian: true, isVegan: true, isEggetarian: false, approximate: true,
    } as never;
    const log = buildFoodLog({ food, grams: 80, date: "2026-01-01", mealCategory: "breakfast", id: "log1" });
    expect(log.calories).toBe(104);
    expect(log.protein).toBe(2.4);
    expect(log.servings).toBe(2);
  });
});

// ── Activity ──────────────────────────────────────────────────

describe("estimateActivityCalories", () => {
  it("uses MET × weight × hours", () => {
    // walking moderate MET 3.5, 70kg, 60min → 3.5*70*1 = 245
    const c = estimateActivityCalories({ type: "walking", durationMin: 60, weightKg: 70 });
    expect(c).toBe(245);
  });

  it("running burns more than walking for same time", () => {
    const walk = estimateActivityCalories({ type: "walking", durationMin: 30, weightKg: 70 });
    const run = estimateActivityCalories({ type: "running", durationMin: 30, weightKg: 70 });
    expect(run).toBeGreaterThan(walk);
  });

  it("higher intensity burns more", () => {
    const low = estimateActivityCalories({ type: "gym", durationMin: 30, weightKg: 70, intensity: "low" });
    const high = estimateActivityCalories({ type: "gym", durationMin: 30, weightKg: 70, intensity: "high" });
    expect(high).toBeGreaterThan(low);
  });
});

describe("estimateSteps", () => {
  it("estimates ~1312 steps per km", () => {
    expect(estimateSteps(1)).toBe(1312);
    expect(estimateSteps(5)).toBe(6560);
  });
});

// ── Energy balance ───────────────────────────────────────────

describe("dailyEnergyBalance", () => {
  it("computes surplus/deficit", () => {
    expect(dailyEnergyBalance({ caloriesConsumed: 2500, totalExpenditure: 2200 })).toBe(300);
    expect(dailyEnergyBalance({ caloriesConsumed: 1800, totalExpenditure: 2200 })).toBe(-400);
  });
});

describe("weeklyAverage", () => {
  it("averages across days", () => {
    const w = weeklyAverage([
      { caloriesConsumed: 2000, totalExpenditure: 2200 },
      { caloriesConsumed: 2400, totalExpenditure: 2200 },
    ]);
    expect(w.avgConsumed).toBe(2200);
    expect(w.avgBalance).toBe(0);
    expect(w.days).toBe(2);
  });
});

// ── Protein cost ─────────────────────────────────────────────

const sampleEgg: FoodPrice = {
  id: "p1", itemName: "Egg", source: "grocery", unit: "piece", quantity: 6, priceINR: 48,
  servingGrams: 50, proteinPer100g: 13, caloriesPer100g: 143, observedAt: "2026-01-01", createdAt: "",
};

const samplePaneer: FoodPrice = {
  id: "p2", itemName: "Paneer", source: "grocery", unit: "g", quantity: 200, priceINR: 90,
  servingGrams: 100, proteinPer100g: 18, caloriesPer100g: 296, observedAt: "2026-01-01", createdAt: "",
};

describe("quantityToGrams", () => {
  it("converts kg to g", () => {
    expect(quantityToGrams({ ...sampleEgg, unit: "kg", quantity: 1 } as FoodPrice)).toBe(1000);
  });
  it("uses servingGrams for pieces", () => {
    expect(quantityToGrams(sampleEgg)).toBe(300); // 6 × 50
  });
  it("uses grams directly", () => {
    expect(quantityToGrams(samplePaneer)).toBe(200);
  });
});

describe("computeProteinCost", () => {
  it("computes cost per gram of protein for eggs", () => {
    // 6 eggs × 50g = 300g, protein = 300/100*13 = 39g
    // cost = 48 / 39 ≈ 1.2308 ₹/g → 1.2308 × 25 = 30.77
    const r = computeProteinCost(sampleEgg);
    expect(r.totalGrams).toBe(300);
    expect(r.totalProtein).toBe(39);
    expect(r.costPerGramProtein).toBe(1.2308);
    expect(r.costPer25gProtein).toBe(30.77);
  });

  it("returns null protein metrics when protein unknown", () => {
    const unknown: FoodPrice = { ...sampleEgg, proteinPer100g: undefined } as FoodPrice;
    const r = computeProteinCost(unknown);
    expect(r.totalProtein).toBeNull();
    expect(r.costPerGramProtein).toBeNull();
  });
});

describe("costForTargetProtein", () => {
  it("computes cost for 30g protein target", () => {
    const r = computeProteinCost(sampleEgg); // 39g protein for ₹48
    const cost = costForTargetProtein(r, 30);
    // 48 / 39 * 30 = 36.92
    expect(cost).toBe(36.92);
  });
  it("returns null when protein unknown", () => {
    const r = computeProteinCost({ ...sampleEgg, proteinPer100g: undefined } as FoodPrice);
    expect(costForTargetProtein(r, 30)).toBeNull();
  });
});

describe("rankProteinOptions", () => {
  it("ranks cheapest per protein first", () => {
    const results = [computeProteinCost(sampleEgg), computeProteinCost(samplePaneer)];
    const ranked = rankProteinOptions(results, "cost_per_protein");
    // paneer: 90/(200/100*18=36) = 2.5 ₹/g ; egg: 1.23 ₹/g → egg first
    expect(ranked[0].price.itemName).toBe("Egg");
  });
});

describe("cheapestProteinCombination", () => {
  it("finds a feasible combination within budget", () => {
    const results = [computeProteinCost(sampleEgg), computeProteinCost(samplePaneer)];
    const opt = cheapestProteinCombination(results, 30);
    expect(opt.feasible).toBe(true);
    expect(opt.totalProtein).toBeGreaterThanOrEqual(30);
  });

  it("respects a calorie budget", () => {
    const results = [computeProteinCost(sampleEgg), computeProteinCost(samplePaneer)];
    const opt = cheapestProteinCombination(results, 30, 300);
    expect(opt.totalCalories).toBeLessThanOrEqual(301); // rounding tolerance
  });
});

describe("sumFoodSpending", () => {
  it("sums prices across logs", () => {
    expect(sumFoodSpending([{ priceINR: 50 }, { priceINR: 25 }, {}])).toBe(75);
  });
});
