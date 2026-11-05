import type { ActivityType } from "@/types";
import { round, safeDivide } from "@/lib/utils";

/**
 * Metabolic Equivalent of Task (MET) values for common activities.
 * Source basis: Compendium of Physical Activities (approximate).
 * Values represent the multiple of resting energy expenditure.
 */
export const MET_VALUES: Record<ActivityType, Record<string, number>> = {
  walking: { low: 2.8, moderate: 3.5, high: 4.3 },
  running: { low: 7.0, moderate: 9.8, high: 11.5 },
  cycling: { low: 4.0, moderate: 6.8, high: 10.0 },
  gym: { low: 3.5, moderate: 5.0, high: 6.5 },
  stairs: { low: 4.0, moderate: 7.0, high: 8.8 },
  other: { low: 3.0, moderate: 4.5, high: 6.0 },
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  walking: "Walking",
  running: "Running",
  cycling: "Cycling",
  gym: "Gym / Strength",
  stairs: "Stairs / Floors",
  other: "Other",
};

/**
 * Estimated calories burned for an activity session using METs.
 *
 * Formula:  kcal = MET × weight(kg) × duration(hours)
 *
 * This is an ESTIMATE. Real expenditure varies with fitness level,
 * terrain, efficiency, and body composition. We deliberately keep this
 * separate from BMR/TDEE so resting energy is never double-counted.
 *
 * If a device reports *total* calories for a session (including resting),
 * do not also add BMR — those totals already include resting energy.
 */
export function estimateActivityCalories(params: {
  type: ActivityType;
  durationMin: number;
  weightKg: number;
  intensity?: "low" | "moderate" | "high";
}): number {
  const { type, durationMin, weightKg } = params;
  const intensity = params.intensity ?? "moderate";
  const met = MET_VALUES[type]?.[intensity] ?? 4.0;
  const hours = safeDivide(durationMin, 60);
  return round(met * weightKg * hours, 0);
}

/**
 * Rough step estimates for distance-based activities.
 * Average stride ~0.762 m → ~1312 steps per km. Used only as a fallback
 * when no step count is provided.
 */
export function estimateSteps(distanceKm: number): number {
  return Math.round(distanceKm * 1312);
}

/** Approximate floors climbed from stairs duration (avg ~1 floor / 20s). */
export function estimateFloorsFromStairs(durationMin: number): number {
  return Math.round(safeDivide(durationMin * 60, 20));
}
