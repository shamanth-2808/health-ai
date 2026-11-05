import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Round to a fixed number of decimals and return a number. */
export function round(value: number, decimals = 1): number {
  const f = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * f) / f;
}

/** Format a number for display with up to `decimals` trailing digits. */
export function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}

/** Format INR currency. */
export function formatINR(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Today's date in YYYY-MM-DD (local). */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Convert a Date to YYYY-MM-DD using local time (avoids UTC off-by-one). */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse a YYYY-MM-DD string into a local Date (noon) to avoid TZ issues. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

/** Return an array of the last `n` days as ISO date strings, oldest first. */
export function lastNDays(n: number, end: Date = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    out.push(toISODate(d));
  }
  return out;
}

/** Add days to an ISO date string. */
export function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Generate a reasonably-unique id (no external dep). */
export function uid(prefix = "id"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Safely divide, returning 0 when the denominator is 0 (avoid NaN/Infinity). */
export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0 || !Number.isFinite(denominator)) return 0;
  return numerator / denominator;
}
