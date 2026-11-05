import { z } from "zod";

export const sexSchema = z.enum(["male", "female"]);
export const activityLevelSchema = z.enum([
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
]);
export const fitnessGoalSchema = z.enum(["fat_loss", "maintenance", "muscle_gain", "general"]);
export const dietaryPreferenceSchema = z.enum([
  "vegetarian",
  "vegan",
  "eggetarian",
  "non_vegetarian",
]);
export const foodSourceSchema = z.enum([
  "home",
  "grocery",
  "restaurant",
  "swiggy",
  "zomato",
  "custom",
]);
export const mealCategorySchema = z.enum(["breakfast", "lunch", "dinner", "snacks"]);
export const activityTypeSchema = z.enum([
  "walking",
  "running",
  "cycling",
  "gym",
  "stairs",
  "other",
]);

/** Full profile / onboarding schema. */
export const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  age: z.coerce.number({ message: "Enter a valid age" }).int().min(10, "Age must be at least 10").max(100, "Age must be under 100"),
  sex: sexSchema,
  heightCm: z.coerce.number({ message: "Enter your height" }).min(100, "Height must be at least 100 cm").max(250, "Height must be under 250 cm"),
  currentWeightKg: z.coerce.number({ message: "Enter your weight" }).min(25, "Weight must be at least 25 kg").max(300, "Weight must be under 300 kg"),
  targetWeightKg: z.coerce.number({ message: "Enter a target weight" }).min(25, "Target must be at least 25 kg").max(300, "Target must be under 300 kg"),
  activityLevel: activityLevelSchema,
  dietaryPreference: dietaryPreferenceSchema,
  allergies: z.array(z.string()).default([]),
  fitnessGoal: fitnessGoalSchema,
  dailyFoodBudgetINR: z.coerce.number({ message: "Enter a budget" }).min(0, "Budget cannot be negative").max(50000),
  preferredFoodSources: z.array(foodSourceSchema).min(1, "Select at least one source"),
  gymAccess: z.boolean().default(false),
  trainingExperience: z.enum(["beginner", "intermediate", "advanced"]),
  workoutDaysPerWeek: z.coerce.number().int().min(0).max(7),
  waistCm: z.coerce.number().min(40).max(200).optional().or(z.literal("").transform(() => undefined)),
  sleepHours: z.coerce.number().min(0).max(24).optional().or(z.literal("").transform(() => undefined)),
  bmrEquation: z.enum(["mifflin_st_jeor", "harris_benedict"]).default("mifflin_st_jeor"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

/** Food log creation schema. */
export const foodLogSchema = z.object({
  date: z.string().min(1),
  mealCategory: mealCategorySchema,
  foodItemId: z.string().min(1, "Select a food"),
  quantityGrams: z.coerce.number().min(1, "Quantity must be at least 1 g"),
  priceINR: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  mealTime: z.string().optional(),
  notes: z.string().max(500).optional(),
});

/** Custom food creation schema. */
export const customFoodSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  category: z.string().min(1),
  caloriesPer100g: z.coerce.number().min(0).max(2000),
  proteinPer100g: z.coerce.number().min(0).max(100),
  carbsPer100g: z.coerce.number().min(0).max(200),
  fatPer100g: z.coerce.number().min(0).max(200),
  fiberPer100g: z.coerce.number().min(0).max(100).default(0),
  servingName: z.string().min(1).default("1 serving"),
  servingGrams: z.coerce.number().min(1).max(2000).default(100),
  isVegetarian: z.boolean().default(true),
  isVegan: z.boolean().default(false),
  isEggetarian: z.boolean().default(false),
});

/** Food price entry schema. */
export const foodPriceSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  foodItemId: z.string().optional(),
  brandOrRestaurant: z.string().optional(),
  source: foodSourceSchema,
  location: z.string().optional(),
  quantity: z.coerce.number().min(0.001, "Quantity must be positive"),
  unit: z.enum(["g", "kg", "ml", "piece", "serving"]),
  priceINR: z.coerce.number().min(0, "Price must be positive"),
  servingGrams: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  proteinPer100g: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  caloriesPer100g: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  observedAt: z.string().min(1),
  sourceUrl: z.string().url().optional().or(z.literal("").transform(() => undefined)),
});

/** Activity log schema. */
export const activityLogSchema = z.object({
  date: z.string().min(1),
  type: activityTypeSchema,
  durationMin: z.coerce.number().int().min(1, "Duration must be at least 1 min").max(600),
  distanceKm: z.coerce.number().min(0).optional().or(z.literal("").transform(() => undefined)),
  steps: z.coerce.number().int().min(0).optional().or(z.literal("").transform(() => undefined)),
  floors: z.coerce.number().int().min(0).optional().or(z.literal("").transform(() => undefined)),
  intensity: z.enum(["low", "moderate", "high"]),
  notes: z.string().max(500).optional(),
});

/** Weight log schema. */
export const weightLogSchema = z.object({
  date: z.string().min(1),
  weightKg: z.coerce.number().min(25, "Weight must be at least 25 kg").max(300),
  waistCm: z.coerce.number().min(40).max(200).optional().or(z.literal("").transform(() => undefined)),
  notes: z.string().max(500).optional(),
});

/** AI coach chat request schema. */
export const coachRequestSchema = z.object({
  message: z.string().min(1, "Message is required").max(1000),
  context: z.object({
    goal: z.string(),
    calorieTarget: z.number(),
    proteinTarget: z.number(),
    caloriesConsumed: z.number(),
    proteinConsumed: z.number(),
    remainingCalories: z.number(),
    remainingProtein: z.number(),
    steps: z.number(),
    stepsTarget: z.number(),
    waterGlasses: z.number(),
    sleepHours: z.number(),
    weightKg: z.number().optional(),
    weightTrend: z.string(),
    foodSpentINR: z.number(),
    dailyBudgetINR: z.number(),
    dietaryPreference: z.string(),
  }),
});

/** AI coach response schema (validated LLM output). */
export const coachResponseSchema = z.object({
  message: z.string().min(1),
  isFallback: z.boolean().optional(),
});
