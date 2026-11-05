// ─────────────────────────────────────────────────────────────
// Health AI — shared domain types
// ─────────────────────────────────────────────────────────────

export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type FitnessGoal = "fat_loss" | "maintenance" | "muscle_gain" | "general";

export type DietaryPreference =
  | "vegetarian"
  | "vegan"
  | "eggetarian"
  | "non_vegetarian";

export type FoodSource =
  | "home"
  | "grocery"
  | "restaurant"
  | "swiggy"
  | "zomato"
  | "custom";

export type MealCategory = "breakfast" | "lunch" | "dinner" | "snacks";

export type ActivityType =
  | "walking"
  | "running"
  | "cycling"
  | "gym"
  | "stairs"
  | "other";

// ── Profile & goals ──────────────────────────────────────────

export interface Profile {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
  dietaryPreference: DietaryPreference;
  allergies: string[];
  fitnessGoal: FitnessGoal;
  dailyFoodBudgetINR: number;
  preferredFoodSources: FoodSource[];
  gymAccess: boolean;
  trainingExperience: "beginner" | "intermediate" | "advanced";
  workoutDaysPerWeek: number;
  waistCm?: number;
  sleepHours?: number;
  bmrEquation: "mifflin_st_jeor" | "harris_benedict";
  createdAt: string;
  updatedAt: string;
}

// ── Food reference data ───────────────────────────────────────

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  // nutrition per 100 g
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  // default serving description & its gram weight
  servingName: string;
  servingGrams: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isEggetarian: boolean;
  // approximate values, especially for mixed/restaurant dishes
  approximate: boolean;
  isCustom?: boolean;
  createdAt?: string;
}

// ── Food logs (meals) ─────────────────────────────────────────

export interface FoodLog {
  id: string;
  date: string; // YYYY-MM-DD
  mealCategory: MealCategory;
  foodItemId: string;
  foodName: string;
  quantityGrams: number;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  priceINR?: number;
  mealTime?: string; // HH:mm
  notes?: string;
  createdAt: string;
}

// ── Food price intelligence ───────────────────────────────────

export interface FoodPrice {
  id: string;
  foodItemId?: string;
  itemName: string;
  brandOrRestaurant?: string;
  source: FoodSource;
  location?: string;
  quantity: number;
  unit: "g" | "kg" | "ml" | "piece" | "serving";
  priceINR: number;
  observedAt: string; // ISO date
  servingGrams?: number;
  proteinPer100g?: number;
  caloriesPer100g?: number;
  sourceUrl?: string;
  isSample?: boolean;
  createdAt: string;
}

// ── Activity logs ─────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  date: string; // YYYY-MM-DD
  type: ActivityType;
  durationMin: number;
  distanceKm?: number;
  steps?: number;
  floors?: number;
  intensity: "low" | "moderate" | "high";
  estimatedCaloriesBurned: number;
  notes?: string;
  createdAt: string;
}

// ── Body metrics ──────────────────────────────────────────────

export interface WeightLog {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  waistCm?: number;
  notes?: string;
  createdAt: string;
}

export interface WaterLog {
  id: string;
  date: string; // YYYY-MM-DD
  glasses: number; // 1 glass = 250 ml
  createdAt: string;
}

export interface SleepLog {
  id: string;
  date: string; // YYYY-MM-DD (night of)
  hours: number;
  quality: "poor" | "fair" | "good" | "excellent";
  createdAt: string;
}

// ── Workouts ──────────────────────────────────────────────────

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  goal: FitnessGoal;
  daysPerWeek: number;
  split: string;
  equipment: "bodyweight" | "gym" | "both";
  createdAt: string;
}

export interface ExerciseTemplate {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: "bodyweight" | "dumbbell" | "barbell" | "machine" | "kettlebell" | "band";
  instructions: string;
  defaultSets: number;
  defaultReps: string;
  defaultRestSec: number;
  isBodyweight: boolean;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  reps: number;
  loadKg: number;
  completed: boolean;
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  date: string; // YYYY-MM-DD
  planId?: string;
  planName?: string;
  durationMin: number;
  estimatedCaloriesBurned: number;
  exercises: WorkoutExercise[];
  notes?: string;
  completed: boolean;
  createdAt: string;
}

// ── Saved meals ───────────────────────────────────────────────

export interface SavedMeal {
  id: string;
  name: string;
  mealCategory: MealCategory;
  items: {
    foodItemId: string;
    foodName: string;
    quantityGrams: number;
  }[];
  createdAt: string;
}

// ── Daily summary (computed, optionally cached) ──────────────

export interface DailySummary {
  date: string;
  caloriesConsumed: number;
  caloriesBurnedActivity: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  steps: number;
  distanceKm: number;
  activeMinutes: number;
  floors: number;
  waterGlasses: number;
  sleepHours: number;
  weightKg?: number;
  foodSpentINR: number;
}

// ── AI coach ──────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  isFallback?: boolean;
}

export interface CoachContext {
  goal: FitnessGoal;
  calorieTarget: number;
  proteinTarget: number;
  caloriesConsumed: number;
  proteinConsumed: number;
  remainingCalories: number;
  remainingProtein: number;
  steps: number;
  stepsTarget: number;
  waterGlasses: number;
  sleepHours: number;
  weightKg?: number;
  weightTrend: "up" | "down" | "stable";
  foodSpentINR: number;
  dailyBudgetINR: number;
  dietaryPreference: DietaryPreference;
}
