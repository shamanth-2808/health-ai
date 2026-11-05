"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { buildFoodLog, nutritionForGrams } from "@/lib/calculations";
import { uid, todayISO } from "@/lib/utils";
import type { FoodItem, MealCategory } from "@/types";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field } from "@/components/shared/field";

const MEAL_LABELS: Record<MealCategory, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snacks: "Snacks",
};

function inferMealCategory(): MealCategory {
  const h = new Date().getHours();
  if (h < 11) return "breakfast";
  if (h < 15) return "lunch";
  if (h < 18) return "snacks";
  return "dinner";
}

export function AddFoodDialog({
  open,
  onOpenChange,
  defaultDate,
  defaultCategory,
  defaultFoodId,
  onLogged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: string;
  defaultCategory?: MealCategory;
  defaultFoodId?: string;
  onLogged?: () => void;
}) {
  const store = useDataStore();
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<FoodItem | null>(null);
  const [grams, setGrams] = React.useState(100);
  const [category, setCategory] = React.useState<MealCategory>(defaultCategory ?? inferMealCategory());
  const [price, setPrice] = React.useState<string>("");
  const [date, setDate] = React.useState(defaultDate ?? todayISO());

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setGrams(100);
      setPrice("");
      setDate(defaultDate ?? todayISO());
      setCategory(defaultCategory ?? inferMealCategory());
      if (defaultFoodId) {
        const f = store.allFoods.find((x) => x.id === defaultFoodId);
        if (f) setSelected(f);
      } else {
        setSelected(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate, defaultCategory, defaultFoodId]);

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return store.allFoods.slice(0, 8);
    return store.allFoods
      .filter((f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, store.allFoods]);

  const nutrition = selected ? nutritionForGrams(selected, grams) : null;

  const submit = () => {
    if (!selected) return;
    const log = buildFoodLog({
      food: selected,
      grams,
      date,
      mealCategory: category,
      priceINR: price ? Number(price) : undefined,
      id: uid("log"),
    });
    store.addFoodLog(log);
    onOpenChange(false);
    onLogged?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-xl">
      <DialogClose onOpenChange={onOpenChange} />
      <DialogHeader>
        <DialogTitle>Log a meal</DialogTitle>
        <DialogDescription>Search the Indian food database and log your intake.</DialogDescription>
      </DialogHeader>

      {!selected ? (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search foods (idli, dosa, egg, paneer...)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-72 space-y-1.5 overflow-y-auto scrollbar-thin">
            {results.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No matches. Try another term or create a custom food on the Food page.</p>
            )}
            {results.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelected(f)}
                className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors hover:bg-accent"
              >
                <div>
                  <p className="font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.category} · {f.caloriesPer100g} kcal · {f.proteinPer100g}g protein / 100g
                  </p>
                </div>
                {f.isCustom && <Badge variant="secondary">Custom</Badge>}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
            <div>
              <p className="font-medium">{selected.name}</p>
              <p className="text-xs text-muted-foreground">
                {selected.servingName} = {selected.servingGrams}g
                {selected.approximate && " · approximate"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
              Change
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity (g)" htmlFor="grams">
              <Input id="grams" type="number" min={1} value={grams} onChange={(e) => setGrams(Math.max(1, Number(e.target.value)))} />
            </Field>
            <Field label="Meal" htmlFor="meal">
              <Select id="meal" value={category} onChange={(e) => setCategory(e.target.value as MealCategory)}>
                {(Object.keys(MEAL_LABELS) as MealCategory[]).map((m) => (
                  <option key={m} value={m}>{MEAL_LABELS[m]}</option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" htmlFor="date">
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Price (₹, optional)" htmlFor="price">
              <Input id="price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </Field>
          </div>

          {nutrition && (
            <div className="grid grid-cols-4 gap-2 rounded-lg border bg-muted/40 p-3 text-center">
              {[
                { label: "Calories", value: `${nutrition.calories}` },
                { label: "Protein", value: `${nutrition.protein}g` },
                { label: "Carbs", value: `${nutrition.carbs}g` },
                { label: "Fat", value: `${nutrition.fat}g` },
              ].map((x) => (
                <div key={x.label}>
                  <p className="text-sm font-semibold">{x.value}</p>
                  <p className="text-xs text-muted-foreground">{x.label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit}>Log meal</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
