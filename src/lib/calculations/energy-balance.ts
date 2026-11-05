import { round } from "@/lib/utils";

/**
 * Daily energy balance = calories consumed − total energy expended.
 *
 * totalExpenditure = TDEE (resting + lifestyle) + activityCalories (logged exercise).
 * We pass totalExpenditure in to keep this function pure and decoupled from BMR math.
 *
 * Positive balance → surplus (energy stored).
 * Negative balance → deficit (energy used from stores).
 *
 * This is an approximation. A single day's balance does not equal fat change;
 * water, glycogen, and sodium cause day-to-day noise.
 */
export function dailyEnergyBalance(params: {
  caloriesConsumed: number;
  totalExpenditure: number;
}): number {
  return round(params.caloriesConsumed - params.totalExpenditure, 0);
}

export interface WeeklyAverage {
  avgConsumed: number;
  avgExpenditure: number;
  avgBalance: number;
  days: number;
}

/**
 * Weekly averages across daily summary entries.
 */
export function weeklyAverage(
  days: { caloriesConsumed: number; totalExpenditure: number }[],
): WeeklyAverage {
  const n = days.length || 1;
  const avgConsumed = round(
    days.reduce((s, d) => s + d.caloriesConsumed, 0) / n,
    0,
  );
  const avgExpenditure = round(
    days.reduce((s, d) => s + d.totalExpenditure, 0) / n,
    0,
  );
  return {
    avgConsumed,
    avgExpenditure,
    avgBalance: round(avgConsumed - avgExpenditure, 0),
    days: days.length,
  };
}
