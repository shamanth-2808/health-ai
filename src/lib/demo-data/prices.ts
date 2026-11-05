import type { FoodPrice } from "@/types";

/**
 * Clearly-labeled SAMPLE prices for the Protein Cost Intelligence module.
 * These are NOT live or scraped prices — they are approximate manual
 * estimates to demonstrate the comparison features. Real usage requires
 * user-entered prices or an authorized data source (not included).
 *
 * `isSample: true` flags them in the UI.
 */
export const SAMPLE_PRICES: Omit<FoodPrice, "id" | "createdAt">[] = [
  // ── Eggs ──────────────────────────────────────────────────────
  { itemName: "Egg", brandOrRestaurant: "Local vendor", source: "home", unit: "piece", quantity: 6, priceINR: 42, servingGrams: 50, proteinPer100g: 13, caloriesPer100g: 143, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Egg", brandOrRestaurant: "Grocery store", source: "grocery", unit: "piece", quantity: 6, priceINR: 48, servingGrams: 50, proteinPer100g: 13, caloriesPer100g: 143, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Egg Curry", brandOrRestaurant: "Darshini Hotel", source: "restaurant", unit: "serving", quantity: 1, priceINR: 80, servingGrams: 250, proteinPer100g: 9, caloriesPer100g: 150, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Egg Curry", brandOrRestaurant: "Andhra Meals", source: "swiggy", unit: "serving", quantity: 1, priceINR: 130, servingGrams: 250, proteinPer100g: 9, caloriesPer100g: 150, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Egg Curry", brandOrRestaurant: "Paradise Biryani", source: "zomato", unit: "serving", quantity: 1, priceINR: 145, servingGrams: 250, proteinPer100g: 9, caloriesPer100g: 150, isSample: true, observedAt: "2026-01-01" },

  // ── Paneer ─────────────────────────────────────────────────────
  { itemName: "Paneer", brandOrRestaurant: "Amul", source: "grocery", unit: "g", quantity: 200, priceINR: 95, servingGrams: 100, proteinPer100g: 18, caloriesPer100g: 296, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Paneer (homemade)", source: "home", unit: "g", quantity: 200, priceINR: 80, servingGrams: 100, proteinPer100g: 18, caloriesPer100g: 296, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Paneer Butter Masala", brandOrRestaurant: "Punjabi Dhaba", source: "restaurant", unit: "serving", quantity: 1, priceINR: 220, servingGrams: 300, proteinPer100g: 7, caloriesPer100g: 200, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Paneer Butter Masala", brandOrRestaurant: "Behrouz", source: "swiggy", unit: "serving", quantity: 1, priceINR: 280, servingGrams: 300, proteinPer100g: 7, caloriesPer100g: 200, isSample: true, observedAt: "2026-01-01" },

  // ── Chicken breast ────────────────────────────────────────────
  { itemName: "Chicken Breast", brandOrRestaurant: "Local butcher", source: "home", unit: "kg", quantity: 1, priceINR: 220, servingGrams: 100, proteinPer100g: 31, caloriesPer100g: 165, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Chicken Breast", brandOrRestaurant: "Licious", source: "grocery", unit: "kg", quantity: 1, priceINR: 320, servingGrams: 100, proteinPer100g: 31, caloriesPer100g: 165, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Grilled Chicken", brandOrRestaurant: "KFC", source: "zomato", unit: "serving", quantity: 1, priceINR: 199, servingGrams: 150, proteinPer100g: 25, caloriesPer100g: 180, isSample: true, observedAt: "2026-01-01" },

  // ── Soy chunks ────────────────────────────────────────────────
  { itemName: "Soy Chunks (dry)", brandOrRestaurant: "Nutrela", source: "grocery", unit: "g", quantity: 220, priceINR: 65, servingGrams: 25, proteinPer100g: 52, caloriesPer100g: 345, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Soy Chunks (dry)", source: "home", unit: "g", quantity: 220, priceINR: 55, servingGrams: 25, proteinPer100g: 52, caloriesPer100g: 345, isSample: true, observedAt: "2026-01-01" },

  // ── Whey protein ───────────────────────────────────────────────
  { itemName: "Whey Protein", brandOrRestaurant: "Optimum Nutrition", source: "grocery", unit: "g", quantity: 907, priceINR: 3200, servingGrams: 30, proteinPer100g: 80, caloriesPer100g: 400, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Whey Protein", brandOrRestaurant: "As-It-IS", source: "grocery", unit: "g", quantity: 1000, priceINR: 2200, servingGrams: 30, proteinPer100g: 80, caloriesPer100g: 400, isSample: true, observedAt: "2026-01-01" },

  // ── Lentils / dal ──────────────────────────────────────────────
  { itemName: "Toor Dal (raw)", source: "grocery", unit: "kg", quantity: 1, priceINR: 130, servingGrams: 50, proteinPer100g: 22, caloriesPer100g: 343, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Moong Dal (raw)", source: "grocery", unit: "kg", quantity: 1, priceINR: 140, servingGrams: 50, proteinPer100g: 24, caloriesPer100g: 347, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Chana Dal (raw)", source: "grocery", unit: "kg", quantity: 1, priceINR: 110, servingGrams: 50, proteinPer100g: 22, caloriesPer100g: 360, isSample: true, observedAt: "2026-01-01" },

  // ── Milk ───────────────────────────────────────────────────────
  { itemName: "Milk", brandOrRestaurant: "Amul Taaza", source: "grocery", unit: "ml", quantity: 1000, priceINR: 64, servingGrams: 244, proteinPer100g: 3.2, caloriesPer100g: 61, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Milk", source: "home", unit: "ml", quantity: 1000, priceINR: 60, servingGrams: 244, proteinPer100g: 3.2, caloriesPer100g: 61, isSample: true, observedAt: "2026-01-01" },

  // ── Fish ───────────────────────────────────────────────────────
  { itemName: "Fish (Rohu)", brandOrRestaurant: "Local market", source: "home", unit: "kg", quantity: 1, priceINR: 240, servingGrams: 100, proteinPer100g: 22, caloriesPer100g: 130, isSample: true, observedAt: "2026-01-01" },

  // ── Restaurant protein (protein unknown) ──────────────────────
  { itemName: "Veg Biryani", brandOrRestaurant: "Meghana", source: "swiggy", unit: "serving", quantity: 1, priceINR: 180, servingGrams: 350, isSample: true, observedAt: "2026-01-01" },
  { itemName: "Chicken Biryani", brandOrRestaurant: "Paradise", source: "zomato", unit: "serving", quantity: 1, priceINR: 260, servingGrams: 400, isSample: true, observedAt: "2026-01-01" },
];
