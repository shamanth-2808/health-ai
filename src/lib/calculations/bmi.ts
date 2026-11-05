import { round, safeDivide } from "@/lib/utils";
import type { WeightLog } from "@/types";

export interface BMICategory {
  label: string;
  color: string; // tailwind text color token
  min: number;
  max: number;
}

export const BMI_CATEGORIES: BMICategory[] = [
  { label: "Underweight", color: "text-blue-500", min: 0, max: 18.5 },
  { label: "Normal", color: "text-emerald-600", min: 18.5, max: 25 },
  { label: "Overweight", color: "text-amber-500", min: 25, max: 30 },
  { label: "Obese", color: "text-red-500", min: 30, max: 100 },
];

/** BMI = weight(kg) / height(m)^2. */
export function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = safeDivide(heightCm, 100);
  if (heightM === 0) return 0;
  return round(safeDivide(weightKg, heightM * heightM), 1);
}

export function getBMICategory(bmi: number): BMICategory {
  return (
    BMI_CATEGORIES.find((c) => bmi >= c.min && bmi < c.max) ??
    BMI_CATEGORIES[BMI_CATEGORIES.length - 1]
  );
}

/** Healthy weight range for a given height (BMI 18.5–24.9). */
export function healthyWeightRange(heightCm: number): { min: number; max: number } {
  const heightM = safeDivide(heightCm, 100);
  return {
    min: round(18.5 * heightM * heightM, 1),
    max: round(24.9 * heightM * heightM, 1),
  };
}

/**
 * Weight trend direction from recent logs.
 * Uses a simple comparison of the average of the last 3 entries vs the
 * 3 before that. A single day's change is NOT meaningful for fat loss.
 */
export function weightTrendDirection(
  logs: WeightLog[],
): {
  direction: "up" | "down" | "stable";
  deltaKg: number;
  recent: number;
  previous: number;
} {
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) {
    return { direction: "stable", deltaKg: 0, recent: sorted[0]?.weightKg ?? 0, previous: 0 };
  }
  const recent = avgWeight(sorted.slice(-3));
  const earlier = avgWeight(sorted.slice(-6, -3).length ? sorted.slice(-6, -3) : sorted.slice(0, -3));
  const deltaKg = round(recent - earlier, 1);
  const direction =
    Math.abs(deltaKg) < 0.2 ? "stable" : deltaKg > 0 ? "up" : "down";
  return { direction, deltaKg, recent, previous: earlier };
}

function avgWeight(arr: WeightLog[]): number {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((s, l) => s + l.weightKg, 0);
  return round(safeDivide(sum, arr.length), 1);
}

/**
 * Simple moving-average trend smoothing for the weight chart.
 * Each point is the average of itself and the surrounding window.
 */
export function movingAverage(values: number[], window = 3): number[] {
  if (values.length === 0) return [];
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const half = Math.floor(window / 2);
    const start = Math.max(0, i - half);
    const end = Math.min(values.length, i + half + 1);
    const slice = values.slice(start, end);
    const avg = safeDivide(slice.reduce((s, v) => s + v, 0), slice.length);
    out.push(round(avg, 1));
  }
  return out;
}
