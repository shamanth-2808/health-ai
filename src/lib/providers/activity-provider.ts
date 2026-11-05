import type { ActivityLog } from "@/types";

/**
 * Activity data provider abstraction.
 *
 * This site does NOT automatically measure steps or floors. Manual entry and
 * CSV import/export are the working options today. This interface defines an
 * extension point for future integration with supported health platforms or
 * wearable APIs (e.g. Apple Health, Google Fit, Garmin). An implementation is
 * only wired in when a real, authorized connector is available and configured.
 *
 * Implementations must NEVER fabricate data. If no source is connected, return
 * an empty array and `connected: false`.
 */
export interface ActivityProvider {
  id: string;
  connected: boolean;
  /** Fetch activity records for a date range (inclusive). */
  fetchRange(startISO: string, endISO: string): Promise<ActivityLog[]>;
}

/** No-op provider used when no wearable/API is connected. Returns nothing. */
export const noopActivityProvider: ActivityProvider = {
  id: "manual",
  connected: false,
  async fetchRange() {
    return [];
  },
};

/**
 * Parse a CSV string of activity records into partial ActivityLogs.
 * Expected columns: date,type,durationMin,distanceKm,steps,floors,intensity,notes
 * Rows with missing date or duration are skipped. Values are coerced.
 */
export function parseActivityCSV(csv: string): Partial<ActivityLog>[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const out: Partial<ActivityLog>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = (cols[idx] ?? "").trim()));
    const date = row["date"];
    const durationMin = Number(row["durationmin"]);
    if (!date || !Number.isFinite(durationMin)) continue;
    out.push({
      date,
      type: (row["type"] || "other") as ActivityLog["type"],
      durationMin,
      distanceKm: row["distancekm"] ? Number(row["distancekm"]) : undefined,
      steps: row["steps"] ? Number(row["steps"]) : undefined,
      floors: row["floors"] ? Number(row["floors"]) : undefined,
      intensity: (row["intensity"] || "moderate") as ActivityLog["intensity"],
      notes: row["notes"] || undefined,
    });
  }
  return out;
}

/** Serialize activity logs to CSV for export. */
export function toActivityCSV(logs: ActivityLog[]): string {
  const header = "date,type,durationMin,distanceKm,steps,floors,intensity,caloriesBurned,notes";
  const rows = logs.map((l) =>
    [l.date, l.type, l.durationMin, l.distanceKm ?? "", l.steps ?? "", l.floors ?? "", l.intensity, l.estimatedCaloriesBurned, `"${(l.notes ?? "").replace(/"/g, '""')}"`].join(","),
  );
  return [header, ...rows].join("\n");
}
