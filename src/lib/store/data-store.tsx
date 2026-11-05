"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ActivityLog,
  FoodItem,
  FoodLog,
  FoodPrice,
  Profile,
  SavedMeal,
  SleepLog,
  WaterLog,
  WeightLog,
  Workout,
} from "@/types";
import { SAMPLE_PRICES } from "@/lib/demo-data/prices";
import { SEED_FOODS } from "@/lib/demo-data/foods";
import { createDemoData } from "@/lib/store/demo-data";
import { todayISO, uid } from "@/lib/utils";

const STORAGE_KEY = "health-ai-store-v1";

interface PersistedState {
  profile: Profile | null;
  onboardingComplete: boolean;
  isDemo: boolean;
  foodLogs: FoodLog[];
  activityLogs: ActivityLog[];
  weightLogs: WeightLog[];
  waterLogs: WaterLog[];
  sleepLogs: SleepLog[];
  workouts: Workout[];
  foodPrices: FoodPrice[];
  savedMeals: SavedMeal[];
  customFoods: FoodItem[];
}

const defaultState: PersistedState = {
  profile: null,
  onboardingComplete: false,
  isDemo: false,
  foodLogs: [],
  activityLogs: [],
  weightLogs: [],
  waterLogs: [],
  sleepLogs: [],
  workouts: [],
  foodPrices: [],
  savedMeals: [],
  customFoods: [],
};

export interface DataStoreValue extends PersistedState {
  hydrated: boolean;
  /** all foods = seed + custom */
  allFoods: FoodItem[];
  // profile / onboarding
  setProfile: (p: Profile) => void;
  completeOnboarding: (p: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  resetToDemo: () => void;
  clearAllData: () => void;
  // food logs
  addFoodLog: (log: FoodLog) => void;
  updateFoodLog: (id: string, patch: Partial<FoodLog>) => void;
  deleteFoodLog: (id: string) => void;
  // activity logs
  addActivityLog: (log: ActivityLog) => void;
  updateActivityLog: (id: string, patch: Partial<ActivityLog>) => void;
  deleteActivityLog: (id: string) => void;
  // weight logs
  addWeightLog: (log: WeightLog) => void;
  updateWeightLog: (id: string, patch: Partial<WeightLog>) => void;
  deleteWeightLog: (id: string) => void;
  // water
  addWater: (date: string, glasses: number) => void;
  setWater: (date: string, glasses: number) => void;
  // sleep
  addSleepLog: (log: SleepLog) => void;
  // workouts
  addWorkout: (w: Workout) => void;
  updateWorkout: (id: string, patch: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;
  // food prices
  addFoodPrice: (p: FoodPrice) => void;
  updateFoodPrice: (id: string, patch: Partial<FoodPrice>) => void;
  deleteFoodPrice: (id: string) => void;
  // saved meals
  addSavedMeal: (m: SavedMeal) => void;
  deleteSavedMeal: (id: string) => void;
  // custom foods
  addCustomFood: (f: FoodItem) => void;
  updateCustomFood: (id: string, patch: Partial<FoodItem>) => void;
  deleteCustomFood: (id: string) => void;
}

const DataStoreContext = createContext<DataStoreValue | null>(null);

export function DataStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount (client only → avoids hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        setState({ ...defaultState, ...parsed });
      }
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  // Persist on change (only after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full / unavailable — in-memory still works
    }
  }, [state, hydrated]);

  const allFoods = useMemo<FoodItem[]>(
    () => [
      ...SEED_FOODS.map((f) => ({ ...f, isCustom: false, createdAt: undefined })),
      ...state.customFoods,
    ],
    [state.customFoods],
  );

  // ── Profile / onboarding ──────────────────────────────────────
  const setProfile = useCallback((p: Profile) => {
    setState((s) => ({ ...s, profile: p }));
  }, []);

  const completeOnboarding = useCallback((p: Profile) => {
    setState((s) => ({
      ...s,
      profile: p,
      onboardingComplete: true,
      isDemo: false,
    }));
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setState((s) =>
      s.profile
        ? { ...s, profile: { ...s.profile, ...patch, updatedAt: new Date().toISOString() } }
        : s,
    );
  }, []);

  const resetToDemo = useCallback(() => {
    const demo = createDemoData();
    setState({
      profile: demo.profile,
      onboardingComplete: false,
      isDemo: true,
      foodLogs: demo.foodLogs,
      activityLogs: demo.activityLogs,
      weightLogs: demo.weightLogs,
      waterLogs: demo.waterLogs,
      sleepLogs: demo.sleepLogs,
      workouts: demo.workouts,
      foodPrices: SAMPLE_PRICES.map((p) => ({ ...p, id: uid("price"), createdAt: new Date().toISOString() })),
      savedMeals: [],
      customFoods: [],
    });
  }, []);

  const clearAllData = useCallback(() => {
    setState({
      ...defaultState,
      foodPrices: SAMPLE_PRICES.map((p) => ({ ...p, id: uid("price"), createdAt: new Date().toISOString() })),
    });
  }, []);

  // ── Food logs ─────────────────────────────────────────────────
  const addFoodLog = useCallback((log: FoodLog) => {
    setState((s) => ({ ...s, foodLogs: [...s.foodLogs, log], isDemo: false }));
  }, []);
  const updateFoodLog = useCallback((id: string, patch: Partial<FoodLog>) => {
    setState((s) => ({ ...s, foodLogs: s.foodLogs.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }, []);
  const deleteFoodLog = useCallback((id: string) => {
    setState((s) => ({ ...s, foodLogs: s.foodLogs.filter((l) => l.id !== id) }));
  }, []);

  // ── Activity ──────────────────────────────────────────────────
  const addActivityLog = useCallback((log: ActivityLog) => {
    setState((s) => ({ ...s, activityLogs: [...s.activityLogs, log], isDemo: false }));
  }, []);
  const updateActivityLog = useCallback((id: string, patch: Partial<ActivityLog>) => {
    setState((s) => ({ ...s, activityLogs: s.activityLogs.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }, []);
  const deleteActivityLog = useCallback((id: string) => {
    setState((s) => ({ ...s, activityLogs: s.activityLogs.filter((l) => l.id !== id) }));
  }, []);

  // ── Weight ────────────────────────────────────────────────────
  const addWeightLog = useCallback((log: WeightLog) => {
    setState((s) => {
      // replace existing entry for the same date, keep latest
      const filtered = s.weightLogs.filter((l) => l.date !== log.date);
      return { ...s, weightLogs: [...filtered, log].sort((a, b) => a.date.localeCompare(b.date)), isDemo: false };
    });
  }, []);
  const updateWeightLog = useCallback((id: string, patch: Partial<WeightLog>) => {
    setState((s) => ({ ...s, weightLogs: s.weightLogs.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  }, []);
  const deleteWeightLog = useCallback((id: string) => {
    setState((s) => ({ ...s, weightLogs: s.weightLogs.filter((l) => l.id !== id) }));
  }, []);

  // ── Water ─────────────────────────────────────────────────────
  const addWater = useCallback((date: string, glasses: number) => {
    setState((s) => {
      const existing = s.waterLogs.find((w) => w.date === date);
      if (existing) {
        return {
          ...s,
          waterLogs: s.waterLogs.map((w) =>
            w.date === date ? { ...w, glasses: Math.max(0, w.glasses + glasses) } : w,
          ),
        };
      }
      return {
        ...s,
        waterLogs: [...s.waterLogs, { id: uid("water"), date, glasses, createdAt: new Date().toISOString() }],
        isDemo: false,
      };
    });
  }, []);
  const setWater = useCallback((date: string, glasses: number) => {
    setState((s) => {
      const existing = s.waterLogs.find((w) => w.date === date);
      if (existing) {
        return { ...s, waterLogs: s.waterLogs.map((w) => (w.date === date ? { ...w, glasses } : w)) };
      }
      return {
        ...s,
        waterLogs: [...s.waterLogs, { id: uid("water"), date, glasses, createdAt: new Date().toISOString() }],
      };
    });
  }, []);

  // ── Sleep ─────────────────────────────────────────────────────
  const addSleepLog = useCallback((log: SleepLog) => {
    setState((s) => {
      const filtered = s.sleepLogs.filter((l) => l.date !== log.date);
      return { ...s, sleepLogs: [...filtered, log].sort((a, b) => a.date.localeCompare(b.date)) };
    });
  }, []);

  // ── Workouts ──────────────────────────────────────────────────
  const addWorkout = useCallback((w: Workout) => {
    setState((s) => ({ ...s, workouts: [...s.workouts, w], isDemo: false }));
  }, []);
  const updateWorkout = useCallback((id: string, patch: Partial<Workout>) => {
    setState((s) => ({ ...s, workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
  }, []);
  const deleteWorkout = useCallback((id: string) => {
    setState((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== id) }));
  }, []);

  // ── Food prices ──────────────────────────────────────────────
  const addFoodPrice = useCallback((p: FoodPrice) => {
    setState((s) => ({ ...s, foodPrices: [...s.foodPrices, p] }));
  }, []);
  const updateFoodPrice = useCallback((id: string, patch: Partial<FoodPrice>) => {
    setState((s) => ({ ...s, foodPrices: s.foodPrices.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  }, []);
  const deleteFoodPrice = useCallback((id: string) => {
    setState((s) => ({ ...s, foodPrices: s.foodPrices.filter((p) => p.id !== id) }));
  }, []);

  // ── Saved meals ───────────────────────────────────────────────
  const addSavedMeal = useCallback((m: SavedMeal) => {
    setState((s) => ({ ...s, savedMeals: [...s.savedMeals, m] }));
  }, []);
  const deleteSavedMeal = useCallback((id: string) => {
    setState((s) => ({ ...s, savedMeals: s.savedMeals.filter((m) => m.id !== id) }));
  }, []);

  // ── Custom foods ──────────────────────────────────────────────
  const addCustomFood = useCallback((f: FoodItem) => {
    setState((s) => ({ ...s, customFoods: [...s.customFoods, f] }));
  }, []);
  const updateCustomFood = useCallback((id: string, patch: Partial<FoodItem>) => {
    setState((s) => ({ ...s, customFoods: s.customFoods.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
  }, []);
  const deleteCustomFood = useCallback((id: string) => {
    setState((s) => ({ ...s, customFoods: s.customFoods.filter((f) => f.id !== id) }));
  }, []);

  const value: DataStoreValue = {
    ...state,
    hydrated,
    allFoods,
    setProfile,
    completeOnboarding,
    updateProfile,
    resetToDemo,
    clearAllData,
    addFoodLog,
    updateFoodLog,
    deleteFoodLog,
    addActivityLog,
    updateActivityLog,
    deleteActivityLog,
    addWeightLog,
    updateWeightLog,
    deleteWeightLog,
    addWater,
    setWater,
    addSleepLog,
    addWorkout,
    updateWorkout,
    deleteWorkout,
    addFoodPrice,
    updateFoodPrice,
    deleteFoodPrice,
    addSavedMeal,
    deleteSavedMeal,
    addCustomFood,
    updateCustomFood,
    deleteCustomFood,
  };

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
}

export function useDataStore(): DataStoreValue {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error("useDataStore must be used within DataStoreProvider");
  return ctx;
}
