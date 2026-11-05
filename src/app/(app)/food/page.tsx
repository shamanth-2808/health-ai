"use client";

import * as React from "react";
import {
  Plus,
  Search,
  Trash2,
  Pencil,
  Bookmark,
  UtensilsCrossed,
  Save,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { useDailySummary } from "@/lib/store/use-daily-summary";
import { buildFoodLog, nutritionForGrams, sumDailyNutrition, nutritionByMeal } from "@/lib/calculations";
import { uid, todayISO, toISODate, addDaysISO, formatNumber, formatINR } from "@/lib/utils";
import type { FoodItem, MealCategory } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/shared/empty-state";
import { AddFoodDialog } from "@/components/dialogs/add-food-dialog";
import { Dialog, DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";

const MEAL_LABELS: Record<MealCategory, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

export default function FoodPage() {
  const store = useDataStore();
  const [date, setDate] = React.useState(todayISO());
  const [activeMeal, setActiveMeal] = React.useState<MealCategory>("breakfast");
  const [addOpen, setAddOpen] = React.useState(false);
  const [customOpen, setCustomOpen] = React.useState(false);
  const [savedOpen, setSavedOpen] = React.useState(false);

  const { nutrition, byMeal, calorieTarget, proteinTarget, remainingCalories, remainingProtein } = useDailySummary(date);

  const dayLogs = React.useMemo(
    () => store.foodLogs.filter((l) => l.date === date),
    [store.foodLogs, date],
  );

  const changeDate = (delta: number) => setDate(addDaysISO(date, delta));

  return (
    <div className="space-y-6">
      <PageHeader title="Food & Nutrition" description="Log meals, track macros, and manage your foods.">
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add meal
        </Button>
        <Button variant="outline" onClick={() => setCustomOpen(true)}>
          <Save className="h-4 w-4" /> Custom food
        </Button>
        <Button variant="outline" onClick={() => setSavedOpen(true)}>
          <Bookmark className="h-4 w-4" /> Saved meals
        </Button>
      </PageHeader>

      {/* Date selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeDate(-1)} aria-label="Previous day">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
          <Button variant="outline" size="icon" onClick={() => changeDate(1)} aria-label="Next day">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {date === todayISO() && <Badge variant="success">Today</Badge>}
      </div>

      {/* Daily totals */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TotalCard label="Calories" value={formatNumber(nutrition.calories)} target={formatNumber(calorieTarget)} pct={calorieTarget ? (nutrition.calories / calorieTarget) * 100 : 0} />
        <TotalCard label="Protein" value={`${formatNumber(nutrition.protein, 1)}g`} target={`${formatNumber(proteinTarget)}g`} pct={proteinTarget ? (nutrition.protein / proteinTarget) * 100 : 0} />
        <TotalCard label="Carbs" value={`${formatNumber(nutrition.carbs, 1)}g`} target={`${formatNumber((calorieTarget * 0.45) / 4)}g`} pct={calorieTarget ? (nutrition.carbs / ((calorieTarget * 0.45) / 4)) * 100 : 0} />
        <TotalCard label="Fat" value={`${formatNumber(nutrition.fat, 1)}g`} target={`${formatNumber((calorieTarget * 0.25) / 9)}g`} pct={calorieTarget ? (nutrition.fat / ((calorieTarget * 0.25) / 9)) * 100 : 0} />
      </div>

      <div className="grid gap-4 text-sm text-muted-foreground">
        <p>
          Remaining: <span className={remainingCalories < 0 ? "font-medium text-destructive" : "font-medium text-foreground"}>{formatNumber(remainingCalories)} kcal</span>
          {" · "}
          Protein left: <span className={remainingProtein < 0 ? "font-medium text-success" : "font-medium text-foreground"}>{formatNumber(Math.max(0, remainingProtein), 1)}g</span>
          {" · "}Fiber: <span className="font-medium text-foreground">{formatNumber(nutrition.fiber, 1)}g</span>
        </p>
      </div>

      {/* Meal tabs */}
      <Tabs value={activeMeal} onValueChange={(v) => setActiveMeal(v as MealCategory)}>
        <div className="overflow-x-auto">
          <TabsList>
            {(Object.keys(MEAL_LABELS) as MealCategory[]).map((m) => {
              const total = byMeal[m].calories;
              return (
                <TabsTrigger key={m} value={m}>
                  {MEAL_LABELS[m]} <span className="ml-1 text-xs text-muted-foreground">{formatNumber(total)}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {(Object.keys(MEAL_LABELS) as MealCategory[]).map((m) => {
          const logs = dayLogs.filter((l) => l.mealCategory === m);
          const mealTotal = byMeal[m];
          return (
            <TabsContent key={m} value={m}>
              <Card>
                <CardContent className="p-4">
                  {logs.length === 0 ? (
                    <EmptyState
                      icon={UtensilsCrossed}
                      title="No meals logged"
                      description={`Log your ${MEAL_LABELS[m].toLowerCase()} to track calories and protein.`}
                      action={
                        <Button size="sm" onClick={() => { setActiveMeal(m); setAddOpen(true); }}>
                          <Plus className="h-4 w-4" /> Add {MEAL_LABELS[m].toLowerCase()}
                        </Button>
                      }
                    />
                  ) : (
                    <div className="space-y-3">
                      {logs.map((log) => (
                        <FoodLogRow key={log.id} log={log} />
                      ))}
                      <div className="flex items-center justify-between border-t pt-3 text-sm font-medium">
                        <span>Meal total</span>
                        <span>{formatNumber(mealTotal.calories)} kcal · {formatNumber(mealTotal.protein, 1)}g protein · {formatINR(logs.reduce((s, l) => s + (l.priceINR ?? 0), 0))}</span>
                      </div>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => { setActiveMeal(m); setAddOpen(true); }}>
                        <Plus className="h-4 w-4" /> Add to {MEAL_LABELS[m].toLowerCase()}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      <AddFoodDialog open={addOpen} onOpenChange={setAddOpen} defaultDate={date} defaultCategory={activeMeal} />
      <CustomFoodDialog open={customOpen} onOpenChange={setCustomOpen} />
      <SavedMealsDialog open={savedOpen} onOpenChange={setSavedOpen} defaultDate={date} defaultCategory={activeMeal} />
    </div>
  );
}

function TotalCard({ label, value, target, pct }: { label: string; value: string; target: string; pct: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value} <span className="text-sm font-normal text-muted-foreground">/ {target}</span></p>
        <Progress value={Math.min(100, pct)} className="mt-2" indicatorClassName={pct > 100 ? "bg-destructive" : undefined} />
      </CardContent>
    </Card>
  );
}

function FoodLogRow({ log }: { log: import("@/types").FoodLog }) {
  const store = useDataStore();
  const [editOpen, setEditOpen] = React.useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{log.foodName}</p>
          {log.priceINR != null && <Badge variant="secondary">{formatINR(log.priceINR)}</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatNumber(log.quantityGrams, 0)}g · {formatNumber(log.servings, 1)} {log.servings === 1 ? "serving" : "servings"}
          {" · "}{log.calories} kcal · {formatNumber(log.protein, 1)}g protein
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)} aria-label="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => store.deleteFoodLog(log.id)} aria-label="Delete">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
      <EditFoodLogDialog open={editOpen} onOpenChange={setEditOpen} log={log} />
    </div>
  );
}

function EditFoodLogDialog({ open, onOpenChange, log }: { open: boolean; onOpenChange: (o: boolean) => void; log: import("@/types").FoodLog }) {
  const store = useDataStore();
  const [grams, setGrams] = React.useState(log.quantityGrams);
  const [category, setCategory] = React.useState(log.mealCategory);
  const [price, setPrice] = React.useState(log.priceINR != null ? String(log.priceINR) : "");

  React.useEffect(() => {
    if (open) {
      setGrams(log.quantityGrams);
      setCategory(log.mealCategory);
      setPrice(log.priceINR != null ? String(log.priceINR) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const food = store.allFoods.find((f) => f.id === log.foodItemId);
  const n = food ? nutritionForGrams(food, grams) : null;

  const save = () => {
    if (!food) {
      // recompute proportionally if food not found
      const ratio = grams / log.quantityGrams;
      store.updateFoodLog(log.id, {
        quantityGrams: grams,
        servings: Math.round((log.servings * ratio) * 100) / 100,
        calories: Math.round(log.calories * ratio),
        protein: Math.round(log.protein * ratio * 10) / 10,
        carbs: Math.round(log.carbs * ratio * 10) / 10,
        fat: Math.round(log.fat * ratio * 10) / 10,
        fiber: Math.round(log.fiber * ratio * 10) / 10,
        mealCategory: category,
        priceINR: price ? Number(price) : undefined,
      });
    } else {
      const updated = buildFoodLog({ food, grams, date: log.date, mealCategory: category, priceINR: price ? Number(price) : undefined, id: log.id, mealTime: log.mealTime, notes: log.notes });
      store.updateFoodLog(log.id, {
        quantityGrams: updated.quantityGrams,
        servings: updated.servings,
        calories: updated.calories,
        protein: updated.protein,
        carbs: updated.carbs,
        fat: updated.fat,
        fiber: updated.fiber,
        mealCategory: updated.mealCategory,
        priceINR: updated.priceINR,
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onOpenChange={onOpenChange} />
      <DialogHeader>
        <DialogTitle>Edit: {log.foodName}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Field label="Quantity (g)" htmlFor="eg">
          <Input id="eg" type="number" min={1} value={grams} onChange={(e) => setGrams(Math.max(1, Number(e.target.value)))} />
        </Field>
        <Field label="Meal" htmlFor="em">
          <Select id="em" value={category} onChange={(e) => setCategory(e.target.value as MealCategory)}>
            {(Object.keys(MEAL_LABELS) as MealCategory[]).map((m) => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
          </Select>
        </Field>
        <Field label="Price (₹, optional)" htmlFor="ep">
          <Input id="ep" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        {n && (
          <div className="grid grid-cols-4 gap-2 rounded-lg border bg-muted/40 p-3 text-center">
            <Mini label="Cal" value={`${n.calories}`} />
            <Mini label="Protein" value={`${formatNumber(n.protein, 1)}`} />
            <Mini label="Carbs" value={`${formatNumber(n.carbs, 1)}`} />
            <Mini label="Fat" value={`${formatNumber(n.fat, 1)}`} />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Save changes</Button>
        </div>
      </div>
    </Dialog>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div><p className="text-sm font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>;
}

function CustomFoodDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const store = useDataStore();
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("Other");
  const [cal, setCal] = React.useState("");
  const [protein, setProtein] = React.useState("");
  const [carbs, setCarbs] = React.useState("");
  const [fat, setFat] = React.useState("");
  const [fiber, setFiber] = React.useState("");
  const [serving, setServing] = React.useState("100");
  const [veg, setVeg] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) { setName(""); setCal(""); setProtein(""); setCarbs(""); setFat(""); setFiber(""); setServing("100"); setVeg(true); setError(""); }
  }, [open]);

  const save = () => {
    if (!name.trim()) { setError("Name is required"); return; }
    const c = Number(cal), p = Number(protein);
    if (!Number.isFinite(c) || c < 0) { setError("Enter valid calories per 100g"); return; }
    if (!Number.isFinite(p) || p < 0) { setError("Enter valid protein per 100g"); return; }
    const food: FoodItem = {
      id: uid("custom"),
      name: name.trim(),
      category: category || "Other",
      caloriesPer100g: c,
      proteinPer100g: p,
      carbsPer100g: Number(carbs) || 0,
      fatPer100g: Number(fat) || 0,
      fiberPer100g: Number(fiber) || 0,
      servingName: "1 serving",
      servingGrams: Number(serving) || 100,
      isVegetarian: veg,
      isVegan: false,
      isEggetarian: !veg,
      approximate: true,
      isCustom: true,
    };
    store.addCustomFood(food);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onOpenChange={onOpenChange} />
      <DialogHeader>
        <DialogTitle>Create custom food</DialogTitle>
        <DialogDescription>Add your own food with nutrition per 100g. Marked approximate.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <Field label="Name" htmlFor="cn" error={error}>
          <Input id="cn" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mom's sambar" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="cc">
            <Input id="cc" value={category} onChange={(e) => setCategory(e.target.value)} />
          </Field>
          <Field label="Serving (g)" htmlFor="cs">
            <Input id="cs" type="number" value={serving} onChange={(e) => setServing(e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Cal /100g" htmlFor="cCal"><Input id="cCal" type="number" value={cal} onChange={(e) => setCal(e.target.value)} /></Field>
          <Field label="Protein /100g" htmlFor="cP"><Input id="cP" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} /></Field>
          <Field label="Carbs /100g" htmlFor="cC"><Input id="cC" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} /></Field>
          <Field label="Fat /100g" htmlFor="cF"><Input id="cF" type="number" value={fat} onChange={(e) => setFat(e.target.value)} /></Field>
          <Field label="Fiber /100g" htmlFor="cFi"><Input id="cFi" type="number" value={fiber} onChange={(e) => setFiber(e.target.value)} /></Field>
          <div className="flex items-end">
            <Select value={veg ? "veg" : "nonveg"} onChange={(e) => setVeg(e.target.value === "veg")}>
              <option value="veg">Vegetarian</option>
              <option value="nonveg">Non-veg</option>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>Add food</Button>
        </div>
      </div>
    </Dialog>
  );
}

function SavedMealsDialog({ open, onOpenChange, defaultDate, defaultCategory }: { open: boolean; onOpenChange: (o: boolean) => void; defaultDate: string; defaultCategory: MealCategory }) {
  const store = useDataStore();
  const [name, setName] = React.useState("");
  const [mealCat, setMealCat] = React.useState<MealCategory>(defaultCategory);

  const saveCurrentAsMeal = () => {
    const logs = store.foodLogs.filter((l) => l.date === defaultDate && l.mealCategory === mealCat);
    if (logs.length === 0 || !name.trim()) return;
    store.addSavedMeal({
      id: uid("sm"),
      name: name.trim(),
      mealCategory: mealCat,
      items: logs.map((l) => ({ foodItemId: l.foodItemId, foodName: l.foodName, quantityGrams: l.quantityGrams })),
      createdAt: new Date().toISOString(),
    });
    setName("");
    onOpenChange(false);
  };

  const logSavedMeal = (mealId: string) => {
    const meal = store.savedMeals.find((m) => m.id === mealId);
    if (!meal) return;
    for (const item of meal.items) {
      const food = store.allFoods.find((f) => f.id === item.foodItemId);
      if (!food) continue;
      store.addFoodLog(buildFoodLog({ food, grams: item.quantityGrams, date: defaultDate, mealCategory: meal.mealCategory, id: uid("log") }));
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onOpenChange={onOpenChange} />
      <DialogHeader>
        <DialogTitle>Saved meals</DialogTitle>
        <DialogDescription>Save a current meal as a template, or quickly log a saved meal.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="mb-2 text-sm font-medium">Save today's meal as a template</p>
          <div className="flex gap-2">
            <Input placeholder="Meal name (e.g. My lunch)" value={name} onChange={(e) => setName(e.target.value)} />
            <Select value={mealCat} onChange={(e) => setMealCat(e.target.value as MealCategory)} className="w-32">
              {(Object.keys(MEAL_LABELS) as MealCategory[]).map((m) => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
            </Select>
          </div>
          <Button size="sm" className="mt-2" onClick={saveCurrentAsMeal} disabled={!name.trim()}>
            <Bookmark className="h-4 w-4" /> Save meal
          </Button>
        </div>

        {store.savedMeals.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No saved meals yet.</p>
        ) : (
          <div className="space-y-2">
            {store.savedMeals.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <div>
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{MEAL_LABELS[m.mealCategory]} · {m.items.length} items</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => logSavedMeal(m.id)}>Log</Button>
                  <Button size="sm" variant="ghost" onClick={() => store.deleteSavedMeal(m.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}
