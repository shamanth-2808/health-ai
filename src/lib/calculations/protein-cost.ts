import type { FoodPrice } from "@/types";
import { round, safeDivide } from "@/lib/utils";

/** Normalize a food price entry's quantity into grams. */
export function quantityToGrams(price: FoodPrice): number {
  switch (price.unit) {
    case "g":
      return price.quantity;
    case "kg":
      return price.quantity * 1000;
    case "ml":
      // approximate 1 ml ≈ 1 g for foods; protein/liquids are close enough for estimates
      return price.quantity;
    case "piece":
      // use servingGrams if available, else default 100g per piece
      return price.servingGrams ? price.servingGrams * price.quantity : 100 * price.quantity;
    case "serving":
      return (price.servingGrams ?? 100) * price.quantity;
    default:
      return price.quantity;
  }
}

/**
 * Protein grams contained in a FoodPrice entry, based on its total quantity.
 * proteinPer100g may be unknown (undefined) for restaurant dishes — in that
 * case protein is null and all per-protein cost functions return null.
 */
export function proteinInPriceEntry(price: FoodPrice): number | null {
  if (price.proteinPer100g == null) return null;
  const grams = quantityToGrams(price);
  return round(safeDivide(grams, 100) * price.proteinPer100g, 1);
}

export interface ProteinCostResult {
  price: FoodPrice;
  totalGrams: number;
  totalProtein: number | null;
  totalCalories: number | null;
  costPerGramProtein: number | null;
  costPer10gProtein: number | null;
  costPer25gProtein: number | null;
  costPer100gProtein: number | null;
  costPerServing: number | null;
  proteinPerRupee: number | null;
  caloriesPerServing: number | null;
  caloriesPer25gProtein: number | null;
}

/**
 * Compute the full protein-economics breakdown for one price entry.
 *
 *   cost_per_target_protein = price / protein_grams * target_protein_grams
 *
 * We return cost-per-gram and derived values; callers pick the target.
 * All division uses safeDivide so we never divide by zero or produce NaN
 * when protein is unknown.
 */
export function computeProteinCost(price: FoodPrice): ProteinCostResult {
  const totalGrams = quantityToGrams(price);
  const totalProtein = proteinInPriceEntry(price);
  const totalCalories =
    price.caloriesPer100g != null
      ? round(safeDivide(totalGrams, 100) * price.caloriesPer100g, 0)
      : null;

  const costPerGramProtein =
    totalProtein != null ? safeDivide(price.priceINR, totalProtein) : null;

  const servingGrams = price.servingGrams ?? totalGrams;

  return {
    price,
    totalGrams,
    totalProtein,
    totalCalories,
    costPerGramProtein: costPerGramProtein != null ? round(costPerGramProtein, 4) : null,
    costPer10gProtein: costPerGramProtein != null ? round(costPerGramProtein * 10, 2) : null,
    costPer25gProtein: costPerGramProtein != null ? round(costPerGramProtein * 25, 2) : null,
    costPer100gProtein: costPerGramProtein != null ? round(costPerGramProtein * 100, 2) : null,
    costPerServing: round(safeDivide(price.priceINR * servingGrams, totalGrams || servingGrams), 2),
    proteinPerRupee: totalProtein != null ? round(safeDivide(totalProtein, price.priceINR), 2) : null,
    caloriesPerServing:
      totalCalories != null
        ? round(safeDivide(totalCalories * servingGrams, totalGrams || servingGrams), 0)
        : null,
    caloriesPer25gProtein:
      totalCalories != null && totalProtein != null && totalProtein > 0
        ? round(safeDivide(totalCalories, totalProtein) * 25, 0)
        : null,
  };
}

/**
 * Cost to obtain a target protein amount from a given entry.
 * cost_per_target_protein = price / protein_grams * target_protein_grams
 */
export function costForTargetProtein(
  result: ProteinCostResult,
  targetProteinGrams: number,
): number | null {
  if (result.totalProtein == null || result.totalProtein === 0) return null;
  return round(
    safeDivide(result.price.priceINR, result.totalProtein) * targetProteinGrams,
    2,
  );
}

export type RankCriterion = "cost_per_protein" | "protein" | "calories" | "protein_per_rupee";

/**
 * Rank a list of price entries by a chosen criterion.
 * - cost_per_protein: cheapest per gram of protein first
 * - protein: highest total protein first
 * - calories: lowest calories per 25g protein first
 * - protein_per_rupee: most protein per rupee first
 */
export function rankProteinOptions(
  entries: ProteinCostResult[],
  criterion: RankCriterion,
): ProteinCostResult[] {
  const withCost = entries.filter((e) => e.totalProtein != null && e.totalProtein > 0);
  const sorted = [...withCost].sort((a, b) => {
    switch (criterion) {
      case "cost_per_protein":
        return (a.costPerGramProtein ?? Infinity) - (b.costPerGramProtein ?? Infinity);
      case "protein":
        return (b.totalProtein ?? 0) - (a.totalProtein ?? 0);
      case "calories":
        return (a.caloriesPer25gProtein ?? Infinity) - (b.caloriesPer25gProtein ?? Infinity);
      case "protein_per_rupee":
        return (b.proteinPerRupee ?? 0) - (a.proteinPerRupee ?? 0);
      default:
        return 0;
    }
  });
  return sorted;
}

/**
 * Find the cheapest combination (greedy) of entries to reach a target protein
 * within an optional calorie budget. Returns selected entries and totals.
 *
 * This is a simplified greedy optimization — pick cheapest per gram protein
 * first until the target is met, respecting the calorie cap. Not a true
 * knapsack, but a transparent, useful heuristic for everyday choices.
 */
export interface OptimizationResult {
  selected: { result: ProteinCostResult; gramsNeeded: number; cost: number; protein: number; calories: number }[];
  totalCost: number;
  totalProtein: number;
  totalCalories: number;
  feasible: boolean;
}

export function cheapestProteinCombination(
  entries: ProteinCostResult[],
  targetProteinGrams: number,
  calorieBudget?: number,
): OptimizationResult {
  const ranked = rankProteinOptions(entries, "cost_per_protein");
  const selected: OptimizationResult["selected"] = [];
  let proteinAccrued = 0;
  let costAccrued = 0;
  let caloriesAccrued = 0;

  for (const r of ranked) {
    if (proteinAccrued >= targetProteinGrams) break;
    if (r.totalProtein == null || r.totalProtein <= 0) continue;

    const remaining = targetProteinGrams - proteinAccrued;
    // grams of this food needed to supply `remaining` protein
    const proteinPerGram = safeDivide(r.totalProtein, r.totalGrams);
    if (proteinPerGram === 0) continue;
    const gramsNeeded = round(safeDivide(remaining, proteinPerGram), 1);

    // cost and calories for those grams (proportional to entry)
    const costForGrams = round(safeDivide(r.price.priceINR, r.totalGrams) * gramsNeeded, 2);
    const caloriesForGrams =
      r.totalCalories != null
        ? round(safeDivide(r.totalCalories, r.totalGrams) * gramsNeeded, 0)
        : 0;

    if (calorieBudget != null && caloriesAccrued + caloriesForGrams > calorieBudget) {
      // try to take a smaller amount that fits the calorie budget
      if (r.totalCalories == null) continue;
      const remainingCalories = Math.max(0, calorieBudget - caloriesAccrued);
      const calPerGram = safeDivide(r.totalCalories, r.totalGrams);
      if (calPerGram === 0) continue;
      const gramsByCalories = round(safeDivide(remainingCalories, calPerGram), 1);
      const proteinFromThat = round(gramsByCalories * proteinPerGram, 1);
      if (proteinFromThat <= 0) continue;
      selected.push({
        result: r,
        gramsNeeded: gramsByCalories,
        cost: round(safeDivide(r.price.priceINR, r.totalGrams) * gramsByCalories, 2),
        protein: proteinFromThat,
        calories: remainingCalories,
      });
      proteinAccrued += proteinFromThat;
      costAccrued += round(safeDivide(r.price.priceINR, r.totalGrams) * gramsByCalories, 2);
      caloriesAccrued += remainingCalories;
      continue;
    }

    selected.push({
      result: r,
      gramsNeeded,
      cost: costForGrams,
      protein: remaining,
      calories: caloriesForGrams,
    });
    proteinAccrued += remaining;
    costAccrued += costForGrams;
    caloriesAccrued += caloriesForGrams;
  }

  return {
    selected,
    totalCost: round(costAccrued, 2),
    totalProtein: round(proteinAccrued, 1),
    totalCalories: round(caloriesAccrued, 0),
    feasible: proteinAccrued >= targetProteinGrams,
  };
}

/** Sum food spending for a list of food logs that have a price. */
export function sumFoodSpending(
  logs: { priceINR?: number }[],
): number {
  return round(logs.reduce((s, l) => s + (l.priceINR ?? 0), 0), 0);
}
