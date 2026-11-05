"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { CalendarDays, RefreshCw, Plus, ShoppingCart, Coins, UtensilsCrossed } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useDailySummary } from "@/lib/store/use-daily-summary";
import { computeProteinCost, costForTargetProtein } from "@/lib/calculations";
import { buildFoodLog } from "@/lib/calculations/nutrition";
import { uid, todayISO, formatNumber, formatINR } from "@/lib/utils";
import type { FoodItem, MealCategory } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/shared/field";
import { CHART_COLORS, axisTickStyle, gridProps, tooltipContentStyle, tooltipLabelStyle } from "@/components/shared/chart-helpers";

interface PlannedMeal {
  category: MealCategory;
  food: FoodItem;
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  estCost: number;
}

const MEAL_DISTRIBUTION: { category: MealCategory; caloriePct: number }[] = [
  { category: "breakfast", caloriePct: 0.25 },
  { category: "lunch", caloriePct: 0.35 },
  { category: "dinner", caloriePct: 0.30 },
  { category: "snacks", caloriePct: 0.10 },
];

export default function MealPlannerPage() {
  const store = useDataStore();
  const { calorieTarget, proteinTarget } = useDailySummary();
  const [plan, setPlan] = React.useState<PlannedMeal[]>([]);
  const [dietPref, setDietPref] = React.useState(store.profile?.dietaryPreference ?? "vegetarian");
  const [budget, setBudget] = React.useState(String(store.profile?.dailyFoodBudgetINR ?? 350));

  const generate = React.useCallback(() => {
    if (!store.profile) return;
    // candidate foods filtered by dietary preference
    const candidates = store.allFoods.filter((f) => matchesDiet(f, dietPref));
    // estimate cost per gram of protein using sample prices where available
    const costPerProtein = (food: FoodItem): number => {
      const price = store.foodPrices.find((p) => p.itemName.toLowerCase().includes(food.name.toLowerCase()) && p.proteinPer100g != null);
      if (price && price.proteinPer100g! > 0) return price.priceINR / (quantityGrams(price) / 100 * price.proteinPer100g!);
      // fallback estimate: protein density * a nominal ₹/100g
      return food.proteinPer100g > 0 ? (food.caloriesPer100g / 10) / food.proteinPer100g : Infinity;
    };

    const meals: PlannedMeal[] = [];
    let remainingCal = calorieTarget;
    let remainingProtein = proteinTarget;
    let remainingBudget = Number(budget) || Infinity;

    for (const slot of MEAL_DISTRIBUTION) {
      const slotCal = Math.round(calorieTarget * slot.caloriePct);
      // sort candidates by protein density then cost per protein
      const sorted = [...candidates].sort((a, b) => {
        const aScore = a.proteinPer100g - costPerProtein(a) * 0.5;
        const bScore = b.proteinPer100g - costPerProtein(b) * 0.5;
        return bScore - aScore;
      });
      // pick a protein anchor + a carb staple for the meal
      const anchor = sorted.find((f) => f.proteinPer100g >= 8) ?? sorted[0];
      const staple = sorted.find((f) => f.category === "Staple" && f.id !== anchor?.id) ?? null;
      const items: { food: FoodItem; grams: number }[] = [];
      let slotProtein = 0;

      if (anchor) {
        const proteinNeeded = Math.max(10, remainingProtein * slot.caloriePct);
        const gramsAnchor = Math.min(400, Math.round((proteinNeeded / anchor.proteinPer100g) * 100));
        items.push({ food: anchor, grams: gramsAnchor });
        slotProtein += (gramsAnchor / 100) * anchor.proteinPer100g;
      }
      if (staple) {
        const calLeft = slotCal - items.reduce((s, i) => s + (i.grams / 100) * i.food.caloriesPer100g, 0);
        const gramsStaple = calLeft > 0 ? Math.min(300, Math.round((calLeft / staple.caloriesPer100g) * 100)) : 100;
        items.push({ food: staple, grams: gramsStaple });
      }

      for (const item of items) {
        const food = item.food;
        const grams = item.grams;
        const cal = Math.round((grams / 100) * food.caloriesPer100g);
        const protein = Math.round((grams / 100) * food.proteinPer100g * 10) / 10;
        const carbs = Math.round((grams / 100) * food.carbsPer100g * 10) / 10;
        const fat = Math.round((grams / 100) * food.fatPer100g * 10) / 10;
        const estCost = Math.round(costPerProtein(food) * protein * 100) / 100;
        meals.push({ category: slot.category, food, grams, calories: cal, protein, carbs, fat, estCost });
        remainingCal -= cal;
        remainingProtein -= protein;
        remainingBudget -= estCost;
      }
    }

    setPlan(meals);
  }, [store, calorieTarget, proteinTarget, dietPref, budget]);

  // generate on mount and when key inputs change
  React.useEffect(() => { generate(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [generate]);

  const totals = plan.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fat: acc.fat + m.fat,
      cost: acc.cost + m.estCost,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0 },
  );

  const replaceMeal = (index: number) => {
    if (!store.profile) return;
    const meal = plan[index];
    const candidates = store.allFoods.filter((f) => matchesDiet(f, dietPref) && f.id !== meal.food.id);
    const replacement = candidates.find((f) => f.proteinPer100g >= meal.food.proteinPer100g - 2);
    if (!replacement) return;
    const grams = Math.round((meal.protein / replacement.proteinPer100g) * 100);
    const calories = Math.round((grams / 100) * replacement.caloriesPer100g);
    const protein = Math.round((grams / 100) * replacement.proteinPer100g * 10) / 10;
    const carbs = Math.round((grams / 100) * replacement.carbsPer100g * 10) / 10;
    const fat = Math.round((grams / 100) * replacement.fatPer100g * 10) / 10;
    const next = [...plan];
    next[index] = { ...meal, food: replacement, grams, calories, protein, carbs, fat };
    setPlan(next);
  };

  const logPlan = () => {
    const date = todayISO();
    plan.forEach((m) => store.addFoodLog(buildFoodLog({ food: m.food, grams: m.grams, date, mealCategory: m.category, id: uid("log") })));
  };

  const groceryList = React.useMemo(() => {
    const map = new Map<string, number>();
    plan.forEach((m) => map.set(m.food.name, (map.get(m.food.name) ?? 0) + m.grams));
    return [...map.entries()];
  }, [plan]);

  const chartData = MEAL_DISTRIBUTION.map((slot) => {
    const meal = plan.filter((m) => m.category === slot.category);
    return {
      name: slot.category,
      calories: meal.reduce((s, m) => s + m.calories, 0),
      protein: meal.reduce((s, m) => s + m.protein, 0),
      cost: meal.reduce((s, m) => s + m.estCost, 0),
    };
  });

  const budgetNum = Number(budget) || 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Meal Planner" description="Auto-plan meals within your calorie, protein and budget targets. Replace any meal to recalculate.">
        <Button onClick={generate} variant="outline"><RefreshCw className="h-4 w-4" /> Regenerate</Button>
        <Button onClick={logPlan}><Plus className="h-4 w-4" /> Log plan today</Button>
      </PageHeader>

      {/* Controls */}
      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Field label="Dietary preference" htmlFor="mp-diet">
            <Select id="mp-diet" value={dietPref} onChange={(e) => setDietPref(e.target.value as typeof dietPref)}>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="eggetarian">Eggetarian</option>
              <option value="non_vegetarian">Non-Vegetarian</option>
            </Select>
          </Field>
          <Field label="Daily budget (₹)" htmlFor="mp-budget">
            <Select id="mp-budget" value={budget} onChange={(e) => setBudget(e.target.value)}>
              {[200, 250, 300, 350, 400, 500, 600].map((b) => <option key={b} value={b}>{formatINR(b)}</option>)}
              <option value={budget}>{budget}</option>
            </Select>
          </Field>
          <div className="flex flex-col justify-end">
            <p className="text-xs text-muted-foreground">Targets: {formatNumber(calorieTarget)} kcal · {formatNumber(proteinTarget)}g protein</p>
            <p className="text-xs text-muted-foreground">Estimates use sample prices — see Protein Cost page.</p>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Calories" value={formatNumber(totals.calories)} target={formatNumber(calorieTarget)} />
        <MiniStat label="Protein" value={`${formatNumber(totals.protein, 1)}g`} target={`${formatNumber(proteinTarget)}g`} />
        <MiniStat label="Est. cost" value={formatINR(totals.cost)} target={formatINR(budgetNum)} over={totals.cost > budgetNum} />
        <MiniStat label="Meals" value={String(plan.length)} target="" />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Plan by meal</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" tick={axisTickStyle} tickLine={false} axisLine={false} />
              <YAxis tick={axisTickStyle} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
              <Legend />
              <Bar dataKey="calories" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="Calories" />
              <Bar dataKey="protein" fill={CHART_COLORS.blue} radius={[4, 4, 0, 0]} name="Protein (g)" />
              <Bar dataKey="cost" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} name="Cost (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Meal cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {MEAL_DISTRIBUTION.map((slot) => {
          const meals = plan.filter((m) => m.category === slot.category);
          return (
            <Card key={slot.category}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base capitalize">{slot.category}</CardTitle>
                <Badge variant="secondary">{formatNumber(meals.reduce((s, m) => s + m.calories, 0))} kcal</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                {meals.length === 0 ? <p className="text-sm text-muted-foreground">No items.</p> : meals.map((m, i) => {
                  const globalIndex = plan.findIndex((x) => x === m);
                  return (
                    <div key={globalIndex} className="flex items-center gap-3 rounded-lg border bg-card/40 px-3 py-2.5 text-sm transition-colors hover:border-primary/30">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <UtensilsCrossed className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{m.food.name} <span className="font-normal text-muted-foreground">· {formatNumber(m.grams)}g</span></p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span className="tnum">{m.calories} kcal</span>
                          <span className="text-primary/80">{formatNumber(m.protein, 1)}g protein</span>
                          <span className="text-amber-600 dark:text-amber-500">~{formatINR(m.estCost)}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => replaceMeal(globalIndex)} aria-label="Replace meal"><RefreshCw className="h-3.5 w-3.5" /></Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grocery list */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> Grocery list</CardTitle>
          <Badge variant="secondary">est. grocery cost</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {groceryList.map(([name, grams]) => (
              <div key={name} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                <span className="font-medium">{name}</span>
                <span className="text-muted-foreground">{formatNumber(grams)}g</span>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Coins className="h-3.5 w-3.5" /> Grocery cost differs from restaurant menu prices, delivery charges, taxes and discounts.
          </p>
        </CardContent>
      </Card>

      {/* Budget progress */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Budget usage</span>
            <span className={totals.cost > budgetNum ? "text-destructive" : ""}>{formatINR(totals.cost)} / {formatINR(budgetNum)}</span>
          </div>
          <Progress value={budgetNum ? Math.min(100, (totals.cost / budgetNum) * 100) : 0} indicatorClassName={totals.cost > budgetNum ? "bg-destructive" : undefined} />
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({ label, value, target, over }: { label: string; value: string; target: string; over?: boolean }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${over ? "text-destructive" : ""}`}>{value}</p>
        {target && <p className="text-xs text-muted-foreground">of {target}</p>}
      </CardContent>
    </Card>
  );
}

/** Check a food matches the dietary preference. */
function matchesDiet(food: FoodItem, pref: string): boolean {
  switch (pref) {
    case "vegan": return food.isVegan;
    case "vegetarian": return food.isVegetarian;
    case "eggetarian": return food.isVegetarian || food.isEggetarian;
    case "non_vegetarian": return true;
    default: return true;
  }
}

function quantityGrams(price: { quantity: number; unit: string; servingGrams?: number }): number {
  switch (price.unit) {
    case "g": return price.quantity;
    case "kg": return price.quantity * 1000;
    case "ml": return price.quantity;
    case "piece": return (price.servingGrams ?? 100) * price.quantity;
    case "serving": return (price.servingGrams ?? 100) * price.quantity;
    default: return price.quantity;
  }
}
