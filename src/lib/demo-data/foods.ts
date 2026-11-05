import type { FoodItem } from "@/types";

/**
 * Starter database of common Indian foods, especially South Indian dishes.
 * Nutrition values are per 100 g. Values for mixed/restaurant dishes are
 * approximate and clearly flagged. Sources: approximate USDA/IFCT-style
 * values and common published estimates; not a substitute for lab analysis.
 *
 * IDs are stable so logs and prices can reference them.
 */
export const SEED_FOODS: Omit<FoodItem, "createdAt">[] = [
  // ── Breakfast / South Indian ──────────────────────────────────
  { id: "idli", name: "Idli", category: "Breakfast", caloriesPer100g: 130, proteinPer100g: 3.2, carbsPer100g: 27, fatPer100g: 0.5, fiberPer100g: 1, servingName: "1 idli", servingGrams: 40, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: true },
  { id: "plain_dosa", name: "Plain Dosa", category: "Breakfast", caloriesPer100g: 168, proteinPer100g: 3.9, carbsPer100g: 28, fatPer100g: 4, fiberPer100g: 0.8, servingName: "1 dosa", servingGrams: 80, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: true },
  { id: "masala_dosa", name: "Masala Dosa", category: "Breakfast", caloriesPer100g: 170, proteinPer100g: 3.5, carbsPer100g: 26, fatPer100g: 5, fiberPer100g: 1.4, servingName: "1 dosa", servingGrams: 120, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: true },
  { id: "rava_idli", name: "Rava Idli", category: "Breakfast", caloriesPer100g: 180, proteinPer100g: 4.5, carbsPer100g: 33, fatPer100g: 4, fiberPer100g: 1, servingName: "1 piece", servingGrams: 55, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: true },
  { id: "pongal", name: "Pongal", category: "Breakfast", caloriesPer100g: 150, proteinPer100g: 4, carbsPer100g: 25, fatPer100g: 4, fiberPer100g: 0.8, servingName: "1 bowl", servingGrams: 200, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: true },
  { id: "upma", name: "Upma", category: "Breakfast", caloriesPer100g: 170, proteinPer100g: 3.5, carbsPer100g: 28, fatPer100g: 4.5, fiberPer100g: 1, servingName: "1 bowl", servingGrams: 200, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: true },
  { id: "poha", name: "Poha", category: "Breakfast", caloriesPer100g: 130, proteinPer100g: 2.5, carbsPer100g: 24, fatPer100g: 3.5, fiberPer100g: 1, servingName: "1 bowl", servingGrams: 150, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: true },
  { id: "uttapam", name: "Uttapam", category: "Breakfast", caloriesPer100g: 175, proteinPer100g: 4.2, carbsPer100g: 27, fatPer100g: 5, fiberPer100g: 1.2, servingName: "1 uttapam", servingGrams: 150, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: true },
  { id: "vada", name: "Medu Vada", category: "Breakfast", caloriesPer100g: 230, proteinPer100g: 5, carbsPer100g: 28, fatPer100g: 10, fiberPer100g: 1.5, servingName: "1 vada", servingGrams: 60, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: true },

  // ── Staples ──────────────────────────────────────────────────
  { id: "rice_white", name: "Rice (cooked white)", category: "Staple", caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3, fiberPer100g: 0.4, servingName: "1 cup", servingGrams: 150, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "rice_brown", name: "Brown Rice (cooked)", category: "Staple", caloriesPer100g: 123, proteinPer100g: 2.7, carbsPer100g: 26, fatPer100g: 1, fiberPer100g: 1.8, servingName: "1 cup", servingGrams: 150, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "chapati", name: "Chapati", category: "Staple", caloriesPer100g: 297, proteinPer100g: 8, carbsPer100g: 46, fatPer100g: 7, fiberPer100g: 4, servingName: "1 chapati", servingGrams: 40, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "roti", name: "Roti", category: "Staple", caloriesPer100g: 290, proteinPer100g: 7.5, carbsPer100g: 45, fatPer100g: 7, fiberPer100g: 3.5, servingName: "1 roti", servingGrams: 40, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "paratha", name: "Paratha (plain)", category: "Staple", caloriesPer100g: 320, proteinPer100g: 8, carbsPer100g: 42, fatPer100g: 11, fiberPer100g: 3, servingName: "1 paratha", servingGrams: 80, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: true },

  // ── Dals / Legumes ────────────────────────────────────────────
  { id: "sambar", name: "Sambar", category: "Dal", caloriesPer100g: 50, proteinPer100g: 2.5, carbsPer100g: 7, fatPer100g: 1.5, fiberPer100g: 2, servingName: "1 bowl", servingGrams: 150, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "dal_cooked", name: "Dal (cooked)", category: "Dal", caloriesPer100g: 116, proteinPer100g: 7, carbsPer100g: 18, fatPer100g: 2.5, fiberPer100g: 3, servingName: "1 bowl", servingGrams: 150, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "chickpeas", name: "Chickpeas (cooked)", category: "Dal", caloriesPer100g: 164, proteinPer100g: 8.9, carbsPer100g: 27, fatPer100g: 2.6, fiberPer100g: 7.6, servingName: "1 cup", servingGrams: 164, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "rajma", name: "Rajma (cooked)", category: "Dal", caloriesPer100g: 127, proteinPer100g: 8.7, carbsPer100g: 22, fatPer100g: 0.5, fiberPer100g: 6, servingName: "1 bowl", servingGrams: 150, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "sprouts", name: "Moong Sprouts", category: "Dal", caloriesPer100g: 80, proteinPer100g: 6, carbsPer100g: 15, fatPer100g: 0.5, fiberPer100g: 4, servingName: "1 bowl", servingGrams: 100, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "chana_roasted", name: "Roasted Chana", category: "Dal", caloriesPer100g: 369, proteinPer100g: 19, carbsPer100g: 58, fatPer100g: 6, fiberPer100g: 12, servingName: "1 handful", servingGrams: 40, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },

  // ── Dairy ─────────────────────────────────────────────────────
  { id: "curd", name: "Curd (plain yogurt)", category: "Dairy", caloriesPer100g: 98, proteinPer100g: 11, carbsPer100g: 3.4, fatPer100g: 4.3, fiberPer100g: 0, servingName: "1 cup", servingGrams: 150, isVegetarian: true, isVegan: false, isEggetarian: false, approximate: false },
  { id: "milk", name: "Milk (whole)", category: "Dairy", caloriesPer100g: 61, proteinPer100g: 3.2, carbsPer100g: 4.8, fatPer100g: 3.3, fiberPer100g: 0, servingName: "1 glass", servingGrams: 244, isVegetarian: true, isVegan: false, isEggetarian: false, approximate: false },
  { id: "paneer", name: "Paneer", category: "Dairy", caloriesPer100g: 296, proteinPer100g: 18, carbsPer100g: 4, fatPer100g: 22, fiberPer100g: 0, servingName: "1 piece", servingGrams: 40, isVegetarian: true, isVegan: false, isEggetarian: false, approximate: false },
  { id: "tofu", name: "Tofu", category: "Dairy", caloriesPer100g: 144, proteinPer100g: 15, carbsPer100g: 2.7, fatPer100g: 8, fiberPer100g: 0.3, servingName: "1 piece", servingGrams: 100, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "buttermilk", name: "Buttermilk", category: "Dairy", caloriesPer100g: 40, proteinPer100g: 3.3, carbsPer100g: 4.8, fatPer100g: 0.9, fiberPer100g: 0, servingName: "1 glass", servingGrams: 240, isVegetarian: true, isVegan: false, isEggetarian: false, approximate: false },

  // ── High-protein plant ────────────────────────────────────────
  { id: "soy_chunks_dry", name: "Soy Chunks (dry)", category: "Protein", caloriesPer100g: 345, proteinPer100g: 52, carbsPer100g: 33, fatPer100g: 0.5, fiberPer100g: 6, servingName: "1 serving", servingGrams: 25, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "soy_chunks_cooked", name: "Soy Chunks (cooked)", category: "Protein", caloriesPer100g: 170, proteinPer100g: 26, carbsPer100g: 12, fatPer100g: 2, fiberPer100g: 3, servingName: "1 serving", servingGrams: 100, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: true },
  { id: "peanuts", name: "Peanuts", category: "Protein", caloriesPer100g: 567, proteinPer100g: 26, carbsPer100g: 16, fatPer100g: 49, fiberPer100g: 8.5, servingName: "1 handful", servingGrams: 30, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "almonds", name: "Almonds", category: "Protein", caloriesPer100g: 579, proteinPer100g: 21, carbsPer100g: 22, fatPer100g: 50, fiberPer100g: 12, servingName: "10 pieces", servingGrams: 12, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "whey", name: "Whey Protein (per scoop)", category: "Protein", caloriesPer100g: 400, proteinPer100g: 80, carbsPer100g: 8, fatPer100g: 6, fiberPer100g: 0, servingName: "1 scoop", servingGrams: 30, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "pea_protein", name: "Pea Protein Powder", category: "Protein", caloriesPer100g: 380, proteinPer100g: 76, carbsPer100g: 8, fatPer100g: 6, fiberPer100g: 4, servingName: "1 scoop", servingGrams: 30, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },

  // ── Non-veg protein ───────────────────────────────────────────
  { id: "egg_whole", name: "Egg (whole)", category: "Protein", caloriesPer100g: 143, proteinPer100g: 13, carbsPer100g: 1.1, fatPer100g: 9.7, fiberPer100g: 0, servingName: "1 egg", servingGrams: 50, isVegetarian: false, isVegan: false, isEggetarian: true, approximate: false },
  { id: "egg_white", name: "Egg White", category: "Protein", caloriesPer100g: 52, proteinPer100g: 11, carbsPer100g: 0.7, fatPer100g: 0.2, fiberPer100g: 0, servingName: "1 white", servingGrams: 33, isVegetarian: false, isVegan: false, isEggetarian: true, approximate: false },
  { id: "chicken_breast", name: "Chicken Breast", category: "Protein", caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6, fiberPer100g: 0, servingName: "100 g", servingGrams: 100, isVegetarian: false, isVegan: false, isEggetarian: false, approximate: false },
  { id: "chicken_curry", name: "Chicken Curry", category: "Protein", caloriesPer100g: 180, proteinPer100g: 20, carbsPer100g: 4, fatPer100g: 9, fiberPer100g: 1, servingName: "1 serving", servingGrams: 200, isVegetarian: false, isVegan: false, isEggetarian: false, approximate: true },
  { id: "fish_rohu", name: "Fish (Rohu)", category: "Protein", caloriesPer100g: 130, proteinPer100g: 22, carbsPer100g: 0, fatPer100g: 4, fiberPer100g: 0, servingName: "1 piece", servingGrams: 100, isVegetarian: false, isVegan: false, isEggetarian: false, approximate: false },
  { id: "fish_curry", name: "Fish Curry", category: "Protein", caloriesPer100g: 120, proteinPer100g: 16, carbsPer100g: 3, fatPer100g: 5, fiberPer100g: 0.5, servingName: "1 serving", servingGrams: 200, isVegetarian: false, isVegan: false, isEggetarian: false, approximate: true },

  // ── Fruits & vegetables ───────────────────────────────────────
  { id: "banana", name: "Banana", category: "Fruit", caloriesPer100g: 89, proteinPer100g: 1.1, carbsPer100g: 23, fatPer100g: 0.3, fiberPer100g: 2.6, servingName: "1 banana", servingGrams: 118, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "apple", name: "Apple", category: "Fruit", caloriesPer100g: 52, proteinPer100g: 0.3, carbsPer100g: 14, fatPer100g: 0.2, fiberPer100g: 2.4, servingName: "1 apple", servingGrams: 182, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "papaya", name: "Papaya", category: "Fruit", caloriesPer100g: 43, proteinPer100g: 0.5, carbsPer100g: 11, fatPer100g: 0.3, fiberPer100g: 1.7, servingName: "1 cup", servingGrams: 140, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "guava", name: "Guava", category: "Fruit", caloriesPer100g: 68, proteinPer100g: 2.6, carbsPer100g: 14, fatPer100g: 1, fiberPer100g: 5.4, servingName: "1 guava", servingGrams: 55, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "orange", name: "Orange", category: "Fruit", caloriesPer100g: 47, proteinPer100g: 0.9, carbsPer100g: 12, fatPer100g: 0.1, fiberPer100g: 2.4, servingName: "1 orange", servingGrams: 131, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "spinach", name: "Spinach (cooked)", category: "Vegetable", caloriesPer100g: 23, proteinPer100g: 3, carbsPer100g: 3.6, fatPer100g: 0.3, fiberPer100g: 2.4, servingName: "1 cup", servingGrams: 180, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "carrot", name: "Carrot", category: "Vegetable", caloriesPer100g: 41, proteinPer100g: 0.9, carbsPer100g: 10, fatPer100g: 0.2, fiberPer100g: 2.8, servingName: "1 carrot", servingGrams: 61, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "tomato", name: "Tomato", category: "Vegetable", caloriesPer100g: 18, proteinPer100g: 0.9, carbsPer100g: 3.9, fatPer100g: 0.2, fiberPer100g: 1.2, servingName: "1 tomato", servingGrams: 123, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },
  { id: "cucumber", name: "Cucumber", category: "Vegetable", caloriesPer100g: 15, proteinPer100g: 0.7, carbsPer100g: 3.6, fatPer100g: 0.1, fiberPer100g: 0.5, servingName: "1 cup", servingGrams: 100, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: false },

  // ── Condiments ────────────────────────────────────────────────
  { id: "coconut_chutney", name: "Coconut Chutney", category: "Condiment", caloriesPer100g: 210, proteinPer100g: 3, carbsPer100g: 16, fatPer100g: 16, fiberPer100g: 3, servingName: "1 serving", servingGrams: 40, isVegetarian: true, isVegan: true, isEggetarian: false, approximate: true },
];

/** Lookup a seed food by id. */
export function getSeedFood(id: string): FoodItem | undefined {
  const f = SEED_FOODS.find((x) => x.id === id);
  if (!f) return undefined;
  return { ...f, isCustom: false, createdAt: undefined };
}
