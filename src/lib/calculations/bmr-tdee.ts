import type { ActivityLevel, FitnessGoal, Sex } from "@/types";
import { round, safeDivide } from "@/lib/utils";

/**
 * Basal Metabolic Rate — energy expended at complete rest.
 *
 * Mifflin–St Jeor (1990) is the default; it is generally the most
 * accurate predictive equation for healthy adults.
 *
 *   Men:   10*kg + 6.25*cm - 5*age + 5
 *   Women: 10*kg + 6.25*cm - 5*age - 161
 *
 * Harris–Benedict (revised, Roza & Shizgal 1984) is offered as an
 * alternative for users whose clinician prefers the older equation.
 */
export function calculateBMR(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  equation?: "mifflin_st_jeor" | "harris_benedict";
}): number {
  const { weightKg, heightCm, age, sex } = params;
  const equation = params.equation ?? "mifflin_st_jeor";

  if (equation === "harris_benedict") {
    // Revised Harris–Benedict
    const base =
      sex === "male"
        ? 88.362 + 13.397 * weightKg + 4.799 * heightCm - 5.677 * age
        : 447.593 + 9.247 * weightKg + 3.098 * heightCm - 4.33 * age;
    return round(base, 0);
  }

  // Mifflin–St Jeor
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
  return round(base, 0);
}

/** Activity multipliers for the TDEE estimate (light activity factor). */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2, // little/no exercise, desk job
  light: 1.375, // 1–3 days/week light
  moderate: 1.55, // 3–5 days/week moderate
  active: 1.725, // 6–7 days/week hard
  very_active: 1.9, // daily training / physical job
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary (little or no exercise)",
  light: "Lightly active (1–3 days/week)",
  moderate: "Moderately active (3–5 days/week)",
  active: "Very active (6–7 days/week)",
  very_active: "Extra active (daily intense training)",
};

/**
 * Total Daily Energy Expenditure = BMR × activity multiplier.
 * This is an *estimate* of resting + lifestyle energy only.
 * It does NOT include separately-logged exercise sessions.
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2;
  return round(bmr * multiplier, 0);
}

/**
 * Goal-based calorie target.
 *
 * Fat loss: a moderate deficit (default 500 kcal/day ≈ 0.5 kg/week).
 * Muscle gain: a modest surplus (default 300 kcal/day).
 * Maintenance / general: stay at TDEE.
 *
 * We clamp the absolute floor to avoid unsafe restriction:
 *   - women: ≥ 1200 kcal/day
 *   - men:   ≥ 1500 kcal/day
 * We never drop below 80% of a 1200-floor target.
 *
 * These are estimates, not medical prescriptions.
 */
export function calculateCalorieTarget(params: {
  tdee: number;
  goal: FitnessGoal;
  sex: Sex;
  deficitKcal?: number;
  surplusKcal?: number;
}): number {
  const { tdee, goal, sex } = params;
  const deficit = params.deficitKcal ?? 500;
  const surplus = params.surplusKcal ?? 300;
  const floor = sex === "male" ? 1500 : 1200;

  let target: number;
  switch (goal) {
    case "fat_loss":
      target = tdee - deficit;
      break;
    case "muscle_gain":
      target = tdee + surplus;
      break;
    case "maintenance":
    case "general":
    default:
      target = tdee;
      break;
  }

  // Safety clamp — never recommend below the sex-specific floor.
  target = Math.max(target, floor);
  return round(target, 0);
}

/**
 * Protein target based on body weight and goal.
 *   fat loss / maintenance: ~1.6 g/kg
 *   muscle gain:            ~2.0 g/kg
 *   general:                 ~1.2 g/kg
 *
 * For overweight/obese individuals, basing protein purely on total body
 * weight overestimates need; we use an adjusted weight (the lesser of
 * actual weight and a weight at BMI 25) when BMI > 25, per common
 * sports-nutrition practice.
 */
export function calculateProteinTarget(params: {
  weightKg: number;
  heightCm: number;
  goal: FitnessGoal;
}): number {
  const { weightKg, heightCm, goal } = params;

  // adjusted weight for higher BMI
  const bmi25WeightKg = round(safeDivide(25 * heightCm * heightCm, 10000), 1);
  const referenceWeight = bmi25WeightKg > 0 ? Math.min(weightKg, bmi25WeightKg) : weightKg;

  let gPerKg: number;
  switch (goal) {
    case "muscle_gain":
      gPerKg = 2.0;
      break;
    case "fat_loss":
    case "maintenance":
      gPerKg = 1.6;
      break;
    case "general":
    default:
      gPerKg = 1.2;
      break;
  }

  return round(referenceWeight * gPerKg, 0);
}

/** Flag a calorie target as potentially unsafe relative to TDEE. */
export function isCalorieTargetUnsafe(
  calorieTarget: number,
  tdee: number,
): { unsafe: boolean; reason?: string } {
  if (calorieTarget < tdee * 0.7) {
    return {
      unsafe: true,
      reason:
        "This target is more than 30% below your estimated TDEE, which may be too aggressive. Consider a smaller deficit and consult a professional.",
    };
  }
  if (calorieTarget < 1200) {
    return {
      unsafe: true,
      reason:
        "Targets below 1200 kcal/day are generally not recommended without professional supervision.",
    };
  }
  return { unsafe: false };
}

/**
 * Full energy profile combining all the above into one result.
 * `activityCalories` (logged exercise) are kept SEPARATE from TDEE so
 * they are never double-counted.
 */
export interface EnergyProfile {
  bmr: number;
  tdee: number;
  calorieTarget: number;
  proteinTarget: number;
  /** estimated calories from logged activity, separate from TDEE */
  activityCalories: number;
  /** total expenditure estimate = TDEE + activityCalories */
  totalDailyExpenditure: number;
  safety: { unsafe: boolean; reason?: string };
}

export function buildEnergyProfile(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  goal: FitnessGoal;
  equation?: "mifflin_st_jeor" | "harris_benedict";
  activityCalories?: number;
  deficitKcal?: number;
  surplusKcal?: number;
}): EnergyProfile {
  const bmr = calculateBMR(params);
  const tdee = calculateTDEE(bmr, params.activityLevel);
  const calorieTarget = calculateCalorieTarget({
    tdee,
    goal: params.goal,
    sex: params.sex,
    deficitKcal: params.deficitKcal,
    surplusKcal: params.surplusKcal,
  });
  const proteinTarget = calculateProteinTarget({
    weightKg: params.weightKg,
    heightCm: params.heightCm,
    goal: params.goal,
  });
  const activityCalories = params.activityCalories ?? 0;
  return {
    bmr,
    tdee,
    calorieTarget,
    proteinTarget,
    activityCalories,
    totalDailyExpenditure: round(tdee + activityCalories, 0),
    safety: isCalorieTargetUnsafe(calorieTarget, tdee),
  };
}
