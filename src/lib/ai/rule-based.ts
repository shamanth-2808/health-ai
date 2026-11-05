import type { CoachContext } from "@/types";

export interface RuleBasedAdvice {
  summary: string;
  actions: string[];
}

/**
 * Deterministic, rule-based recommendations used as the AI coach fallback
 * (when no LLM key is configured) and as the dashboard daily summary.
 * These are computed, not generated — no external calls.
 */
export function generateRuleBasedAdvice(ctx: CoachContext): RuleBasedAdvice {
  const actions: string[] = [];
  const parts: string[] = [];

  // Calories
  if (ctx.remainingCalories < 0) {
    actions.push(`You're ${Math.abs(Math.round(ctx.remainingCalories))} kcal over today's target. Consider a 20–30 min walk or a lighter dinner.`);
    parts.push(`over your calorie target by ${Math.abs(Math.round(ctx.remainingCalories))} kcal`);
  } else if (ctx.remainingCalories > 0 && ctx.remainingCalories < 300) {
    actions.push(`You have ${Math.round(ctx.remainingCalories)} kcal left. Add a protein-rich snack like curd or eggs to hit your target.`);
    parts.push(`${Math.round(ctx.remainingCalories)} kcal under your target`);
  } else {
    parts.push(`${Math.round(ctx.remainingCalories)} kcal remaining for the day`);
  }

  // Protein
  if (ctx.remainingProtein > 15) {
    const cheapTip = ctx.dietaryPreference === "non_vegetarian" || ctx.dietaryPreference === "eggetarian"
      ? "Eggs (≈₹8 each, ~6g protein) are among the cheapest protein sources."
      : "Soy chunks (~52g protein per 100g) and roasted chana are budget-friendly vegetarian protein.";
    actions.push(`You need ~${Math.round(ctx.remainingProtein)}g more protein today. ${cheapTip} Check the Protein Cost page for the cheapest option.`);
  } else if (ctx.remainingProtein < 0) {
    parts.push(`protein target met (exceeded by ${Math.abs(Math.round(ctx.remainingProtein))}g)`);
  } else {
    parts.push(`protein nearly on target (${Math.round(ctx.proteinConsumed)}/${Math.round(ctx.proteinTarget)}g)`);
  }

  // Steps
  const stepsPct = ctx.stepsTarget > 0 ? ctx.steps / ctx.stepsTarget : 0;
  if (stepsPct < 0.5) {
    actions.push(`You're at ${Math.round(ctx.steps).toLocaleString("en-IN")} of ${ctx.stepsTarget.toLocaleString("en-IN")} steps. A 15-minute walk adds ~1,500 steps.`);
  } else if (stepsPct < 1) {
    actions.push(`Almost there — ${Math.round((ctx.stepsTarget - ctx.steps)).toLocaleString("en-IN")} steps to hit today's goal.`);
  }

  // Water
  if (ctx.waterGlasses < 6) {
    actions.push(`Water intake is low (${ctx.waterGlasses} glasses). Aim for 8 glasses (≈2L) today.`);
  }

  // Sleep
  if (ctx.sleepHours > 0 && ctx.sleepHours < 6.5) {
    actions.push(`You slept ${ctx.sleepHours}h last night. Poor sleep can raise hunger and reduce recovery — prioritize an earlier bedtime.`);
  }

  // Budget
  if (ctx.foodSpentINR > ctx.dailyBudgetINR) {
    actions.push(`Food spending (₹${Math.round(ctx.foodSpentINR)}) is over your daily budget (₹${ctx.dailyBudgetINR}). Home-cooked meals usually beat delivery on cost per protein.`);
  } else if (ctx.dailyBudgetINR - ctx.foodSpentINR < 50) {
    actions.push(`You're close to your daily food budget. Plan dinner at home to stay within ₹${ctx.dailyBudgetINR}.`);
  }

  // Weight trend
  if (ctx.weightTrend === "down") {
    parts.push("weight trending down");
  } else if (ctx.weightTrend === "up") {
    parts.push("weight trending up — review calorie balance if fat loss is your goal");
  }

  const summary = `Today's snapshot: ${parts.join("; ")}. ${
    actions.length > 0
      ? "Here's what to focus on next:"
      : "You're on track — maintain the consistency."
  }`;

  return { summary, actions: actions.length > 0 ? actions : ["Keep logging consistently to build accurate trends and recommendations."] };
}

/** Suggested questions for the coach chat UI. */
export const SUGGESTED_QUESTIONS = [
  "What should I eat for dinner with my remaining calories and protein?",
  "What's the cheapest way to get another 30g of protein?",
  "What workout should I do today?",
  "How have my weight and food expenses changed this week?",
  "How should I adjust tomorrow's activity?",
  "Compare a vegetarian and non-vegetarian diet within my budget.",
];
