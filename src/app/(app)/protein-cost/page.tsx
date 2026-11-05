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
} from "recharts";
import { Plus, Trash2, Coins, Beef, ShoppingBag, Bike, Store, Home, Pencil } from "lucide-react";
import { useDataStore } from "@/lib/store/data-store";
import { computeProteinCost, rankProteinOptions, cheapestProteinCombination, costForTargetProtein, type RankCriterion, type ProteinCostResult } from "@/lib/calculations/protein-cost";
import { uid, todayISO, formatNumber, formatINR } from "@/lib/utils";
import type { FoodPrice, FoodSource } from "@/types";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { CHART_COLORS, axisTickStyle, gridProps, tooltipContentStyle, tooltipLabelStyle } from "@/components/shared/chart-helpers";

const SOURCE_LABELS: Record<FoodSource, string> = {
  home: "Home", grocery: "Grocery", restaurant: "Restaurant", swiggy: "Swiggy", zomato: "Zomato", custom: "Custom",
};
const SOURCE_ICONS: Record<FoodSource, typeof Coins> = {
  home: Home, grocery: ShoppingBag, restaurant: Store, swiggy: Bike, zomato: Bike, custom: Coins,
};

export default function ProteinCostPage() {
  const store = useDataStore();
  const [addOpen, setAddOpen] = React.useState(false);
  const [criterion, setCriterion] = React.useState<RankCriterion>("cost_per_protein");
  const [targetProtein, setTargetProtein] = React.useState("30");
  const [calBudget, setCalBudget] = React.useState("");
  const [dietFilter, setDietFilter] = React.useState<"all" | "veg" | "nonveg">("all");
  const [editPrice, setEditPrice] = React.useState<FoodPrice | null>(null);

  const results = React.useMemo<ProteinCostResult[]>(
    () => store.foodPrices.map((p) => computeProteinCost(p)).filter((r) => r.totalProtein != null && r.totalProtein > 0),
    [store.foodPrices],
  );

  // diet classification: items containing egg/chicken/fish → nonveg
  const isNonVeg = (name: string) => /egg|chicken|fish|meat|mutton|prawn/i.test(name);
  const filteredResults = React.useMemo(() => {
    if (dietFilter === "all") return results;
    return results.filter((r) => (dietFilter === "veg" ? !isNonVeg(r.price.itemName) : isNonVeg(r.price.itemName)));
  }, [results, dietFilter]);

  const ranked = React.useMemo(() => rankProteinOptions(filteredResults, criterion), [filteredResults, criterion]);

  const target = Number(targetProtein) || 30;
  const optimization = React.useMemo(
    () => cheapestProteinCombination(filteredResults, target, calBudget ? Number(calBudget) : undefined),
    [filteredResults, target, calBudget],
  );

  const cheapest = ranked[0];
  const avgCostPer25g = results.length
    ? results.reduce((s, r) => s + (r.costPer25gProtein ?? 0), 0) / results.length
    : 0;

  // chart: cost per 25g protein for top 10 cheapest
  const chartData = ranked.slice(0, 10).map((r) => ({
    name: r.price.itemName.length > 14 ? r.price.itemName.slice(0, 12) + "…" : r.price.itemName,
    cost: r.costPer25gProtein ?? 0,
    source: r.price.source,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Protein Cost Intelligence" description="Compare protein value across grocery, home, restaurant and delivery. Sample prices are clearly labeled — add your own for accuracy.">
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add price</Button>
      </PageHeader>

      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
        Prices marked <Badge variant="warning" className="mx-1">sample</Badge> are approximate estimates for demonstration — not live or scraped data. Add your own observed prices for real comparisons. cost_per_target_protein = price ÷ protein_grams × target_protein_grams.
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Cheapest /25g protein" value={cheapest ? formatINR(cheapest.costPer25gProtein ?? 0) : "—"} icon={Coins} accent="green" hint={cheapest?.price.itemName} />
        <StatCard label="Avg cost /25g protein" value={formatINR(avgCostPer25g)} icon={Beef} accent="blue" />
        <StatCard label="Cost for {target}g protein" value={optimization.totalCost ? formatINR(optimization.totalCost) : "—"} icon={Coins} accent="amber" hint={`${formatNumber(target)}g target`} />
        <StatCard label="Feasible?" value={optimization.feasible ? "Yes" : "No"} icon={Coins} accent={optimization.feasible ? "green" : "red"} hint={`${formatNumber(optimization.totalProtein, 1)}g achievable`} />
      </div>

      {/* Optimizer */}
      <Card>
        <CardHeader><CardTitle className="text-base">Budget optimizer</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Target protein (g)" htmlFor="tp"><Input id="tp" type="number" value={targetProtein} onChange={(e) => setTargetProtein(e.target.value)} /></Field>
            <Field label="Calorie budget (optional)" htmlFor="cb"><Input id="cb" type="number" value={calBudget} onChange={(e) => setCalBudget(e.target.value)} placeholder="no limit" /></Field>
            <Field label="Diet filter" htmlFor="df">
              <Select id="df" value={dietFilter} onChange={(e) => setDietFilter(e.target.value as "all" | "veg" | "nonveg")}>
                <option value="all">All foods</option>
                <option value="veg">Vegetarian only</option>
                <option value="nonveg">Non-veg only</option>
              </Select>
            </Field>
          </div>
          {optimization.selected.length > 0 ? (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <p className="text-sm font-medium">Cheapest combination ({optimization.feasible ? "meets target" : "partial — try more sources or remove calorie cap"}):</p>
              {optimization.selected.map((s) => (
                <div key={s.result.price.id} className="flex items-center justify-between text-sm">
                  <span>{s.result.price.itemName} — {formatNumber(s.gramsNeeded)}g</span>
                  <span className="text-muted-foreground">{formatINR(s.cost)} · {formatNumber(s.protein, 1)}g protein</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                <span>Total</span>
                <span>{formatINR(optimization.totalCost)} · {formatNumber(optimization.totalProtein, 1)}g protein{optimization.totalCalories > 0 ? ` · ${formatNumber(optimization.totalCalories)} kcal` : ""}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Add prices with protein data to use the optimizer.</p>
          )}
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Cost per 25g protein — cheapest 10</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid {...gridProps} horizontal={false} />
                <XAxis type="number" tick={axisTickStyle} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={axisTickStyle} tickLine={false} axisLine={false} width={90} />
                <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} formatter={(v: number) => formatINR(v)} />
                <Bar dataKey="cost" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Ranked table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Price comparison</CardTitle>
          <Field label="" htmlFor="crit" className="mb-0">
            <Select id="crit" value={criterion} onChange={(e) => setCriterion(e.target.value as RankCriterion)} className="w-48">
              <option value="cost_per_protein">Sort: cheapest per protein</option>
              <option value="protein">Sort: most protein</option>
              <option value="calories">Sort: fewest calories /25g</option>
              <option value="protein_per_rupee">Sort: protein per ₹</option>
            </Select>
          </Field>
        </CardHeader>
        <CardContent>
          {ranked.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No comparable prices yet. Add prices with protein data.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Protein</TableHead>
                  <TableHead className="text-right">₹/25g protein</TableHead>
                  <TableHead className="text-right">Protein/₹</TableHead>
                  <TableHead className="text-right">kcal/25g</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((r) => {
                  const Icon = SOURCE_ICONS[r.price.source] ?? Coins;
                  return (
                    <TableRow key={r.price.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.price.itemName}</span>
                          {r.price.isSample && <Badge variant="warning">sample</Badge>}
                        </div>
                        {r.price.brandOrRestaurant && <p className="text-xs text-muted-foreground">{r.price.brandOrRestaurant}</p>}
                      </TableCell>
                      <TableCell><span className="inline-flex items-center gap-1 text-sm"><Icon className="h-3.5 w-3.5" />{SOURCE_LABELS[r.price.source]}</span></TableCell>
                      <TableCell className="text-right">{formatINR(r.price.priceINR)}</TableCell>
                      <TableCell className="text-right">{formatNumber(r.totalProtein ?? 0, 1)}g</TableCell>
                      <TableCell className="text-right font-medium">{r.costPer25gProtein != null ? formatINR(r.costPer25gProtein) : "—"}</TableCell>
                      <TableCell className="text-right">{r.proteinPerRupee != null ? formatNumber(r.proteinPerRupee, 2) : "—"}</TableCell>
                      <TableCell className="text-right">{r.caloriesPer25gProtein != null ? formatNumber(r.caloriesPer25gProtein) : "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setEditPrice(r.price)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* All entries management */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">All price entries ({store.foodPrices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {store.foodPrices.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.itemName} {p.isSample && <Badge variant="warning">sample</Badge>}</p>
                  <p className="text-xs text-muted-foreground">{SOURCE_LABELS[p.source]} · {formatINR(p.priceINR)} for {p.quantity}{p.unit} · {p.proteinPer100g != null ? `${p.proteinPer100g}g protein/100g` : "protein unknown"}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditPrice(p)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => store.deleteFoodPrice(p.id)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <PriceDialog open={addOpen} onOpenChange={setAddOpen} />
      {editPrice && <PriceDialog open onOpenChange={(o) => { if (!o) setEditPrice(null); }} editing={editPrice} />}
    </div>
  );
}

function PriceDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (o: boolean) => void; editing?: FoodPrice }) {
  const store = useDataStore();
  const [itemName, setItemName] = React.useState("");
  const [brand, setBrand] = React.useState("");
  const [source, setSource] = React.useState<FoodSource>("grocery");
  const [quantity, setQuantity] = React.useState("100");
  const [unit, setUnit] = React.useState<"g" | "kg" | "ml" | "piece" | "serving">("g");
  const [price, setPrice] = React.useState("");
  const [serving, setServing] = React.useState("");
  const [protein, setProtein] = React.useState("");
  const [calories, setCalories] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setItemName(editing?.itemName ?? "");
      setBrand(editing?.brandOrRestaurant ?? "");
      setSource(editing?.source ?? "grocery");
      setQuantity(editing ? String(editing.quantity) : "100");
      setUnit(editing?.unit ?? "g");
      setPrice(editing ? String(editing.priceINR) : "");
      setServing(editing?.servingGrams ? String(editing.servingGrams) : "");
      setProtein(editing?.proteinPer100g != null ? String(editing.proteinPer100g) : "");
      setCalories(editing?.caloriesPer100g != null ? String(editing.caloriesPer100g) : "");
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const save = () => {
    if (!itemName.trim()) { setError("Item name is required"); return; }
    const priceNum = Number(price);
    const qtyNum = Number(quantity);
    if (!Number.isFinite(priceNum) || priceNum < 0) { setError("Enter a valid price"); return; }
    if (!Number.isFinite(qtyNum) || qtyNum <= 0) { setError("Enter a valid quantity"); return; }

    const entry: FoodPrice = {
      id: editing?.id ?? uid("price"),
      itemName: itemName.trim(),
      brandOrRestaurant: brand.trim() || undefined,
      source,
      location: undefined,
      quantity: qtyNum,
      unit,
      priceINR: priceNum,
      servingGrams: serving ? Number(serving) : undefined,
      proteinPer100g: protein ? Number(protein) : undefined,
      caloriesPer100g: calories ? Number(calories) : undefined,
      observedAt: editing?.observedAt ?? todayISO(),
      sourceUrl: undefined,
      isSample: editing?.isSample ?? false,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    if (editing) store.updateFoodPrice(editing.id, entry);
    else store.addFoodPrice(entry);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-xl">
      <DialogClose onOpenChange={onOpenChange} />
      <DialogHeader>
        <DialogTitle>{editing ? "Edit price" : "Add price entry"}</DialogTitle>
        <DialogDescription>Store observed prices with source and date. Protein per 100g unlocks cost-per-protein metrics.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Item name" htmlFor="p-item" error={error}>
            <Input id="p-item" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Eggs" />
          </Field>
          <Field label="Brand / restaurant (optional)" htmlFor="p-brand">
            <Input id="p-brand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Amul" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Source" htmlFor="p-source">
            <Select id="p-source" value={source} onChange={(e) => setSource(e.target.value as FoodSource)}>
              {(Object.keys(SOURCE_LABELS) as FoodSource[]).map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
            </Select>
          </Field>
          <Field label="Observed date" htmlFor="p-date">
            <Input id="p-date" type="date" value={editing?.observedAt ?? todayISO()} disabled />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Quantity" htmlFor="p-qty"><Input id="p-qty" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field>
          <Field label="Unit" htmlFor="p-unit">
            <Select id="p-unit" value={unit} onChange={(e) => setUnit(e.target.value as typeof unit)}>
              <option value="g">g</option><option value="kg">kg</option><option value="ml">ml</option><option value="piece">piece</option><option value="serving">serving</option>
            </Select>
          </Field>
          <Field label="Price (₹)" htmlFor="p-price"><Input id="p-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Serving (g, optional)" htmlFor="p-serv"><Input id="p-serv" type="number" value={serving} onChange={(e) => setServing(e.target.value)} placeholder="100" /></Field>
          <Field label="Protein /100g" htmlFor="p-prot"><Input id="p-prot" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="unknown" /></Field>
          <Field label="Calories /100g" htmlFor="p-cal"><Input id="p-cal" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="unknown" /></Field>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save}>{editing ? "Update" : "Add price"}</Button>
        </div>
      </div>
    </Dialog>
  );
}
