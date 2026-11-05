import type { ExerciseTemplate, FitnessGoal } from "@/types";

/**
 * Exercise library with sets, reps, rest, and instructions.
 * Equipment options: bodyweight, dumbbell, barbell, machine, kettlebell, band.
 * Substitutions are suggested in the UI for injuries/restrictions.
 */
export const EXERCISE_LIBRARY: ExerciseTemplate[] = [
  // Bodyweight / beginner-friendly
  { id: "pushup", name: "Push-up", muscleGroup: "Chest", equipment: "bodyweight", instructions: "Hands shoulder-width, lower chest to floor, push back up keeping core tight.", defaultSets: 3, defaultReps: "8-12", defaultRestSec: 60, isBodyweight: true },
  { id: "squat_bw", name: "Bodyweight Squat", muscleGroup: "Legs", equipment: "bodyweight", instructions: "Feet shoulder-width, sit back into hips, keep chest up, drive through heels.", defaultSets: 3, defaultReps: "12-15", defaultRestSec: 60, isBodyweight: true },
  { id: "lunge", name: "Lunge", muscleGroup: "Legs", equipment: "bodyweight", instructions: "Step forward, drop back knee toward floor, push back to start. Alternate legs.", defaultSets: 3, defaultReps: "10 each leg", defaultRestSec: 60, isBodyweight: true },
  { id: "plank", name: "Plank", muscleGroup: "Core", equipment: "bodyweight", instructions: "Forearms on floor, body straight, hold for time. Brace abs, don't let hips sag.", defaultSets: 3, defaultReps: "30-45s", defaultRestSec: 45, isBodyweight: true },
  { id: "glute_bridge", name: "Glute Bridge", muscleGroup: "Glutes", equipment: "bodyweight", instructions: "Lie on back, knees bent, drive hips up squeezing glutes. Pause at top.", defaultSets: 3, defaultReps: "12-15", defaultRestSec: 45, isBodyweight: true },
  { id: "wall_pushup", name: "Wall Push-up", muscleGroup: "Chest", equipment: "bodyweight", instructions: "Easier push-up variant against a wall. Good for beginners or shoulder issues.", defaultSets: 3, defaultReps: "10-15", defaultRestSec: 45, isBodyweight: true },
  { id: "step_up", name: "Step-up", muscleGroup: "Legs", equipment: "bodyweight", instructions: "Step onto a bench/stairs, drive through working leg, lower controlled. Alternate legs.", defaultSets: 3, defaultReps: "10 each leg", defaultRestSec: 60, isBodyweight: true },

  // Dumbbell
  { id: "db_press", name: "Dumbbell Bench Press", muscleGroup: "Chest", equipment: "dumbbell", instructions: "Lie on bench, press dumbbells over chest, lower with control to chest level.", defaultSets: 4, defaultReps: "8-12", defaultRestSec: 90, isBodyweight: false },
  { id: "db_row", name: "Dumbbell Row", muscleGroup: "Back", equipment: "dumbbell", instructions: "Hinge forward, one hand on bench, row dumbbell to hip, squeeze shoulder blade.", defaultSets: 4, defaultReps: "8-12", defaultRestSec: 90, isBodyweight: false },
  { id: "db_curl", name: "Dumbbell Curl", muscleGroup: "Arms", equipment: "dumbbell", instructions: "Curl dumbbells with control, avoid swinging. Squeeze biceps at top.", defaultSets: 3, defaultReps: "10-12", defaultRestSec: 60, isBodyweight: false },
  { id: "db_ohp", name: "Dumbbell Overhead Press", muscleGroup: "Shoulders", equipment: "dumbbell", instructions: "Press dumbbells overhead from shoulder height, keep core braced.", defaultSets: 3, defaultReps: "8-12", defaultRestSec: 90, isBodyweight: false },
  { id: "db_ldl", name: "Dumbbell Romanian Deadlift", muscleGroup: "Legs", equipment: "dumbbell", instructions: "Hinge at hips with slight knee bend, lower dumbbells along legs, feel hamstring stretch.", defaultSets: 4, defaultReps: "10-12", defaultRestSec: 90, isBodyweight: false },
  { id: "db_lateral_raise", name: "Dumbbell Lateral Raise", muscleGroup: "Shoulders", equipment: "dumbbell", instructions: "Raise dumbbells to side to shoulder height, lead with elbows.", defaultSets: 3, defaultReps: "12-15", defaultRestSec: 60, isBodyweight: false },

  // Barbell
  { id: "squat", name: "Barbell Back Squat", muscleGroup: "Legs", equipment: "barbell", instructions: "Bar on upper back, brace core, descend to parallel, drive up through heels.", defaultSets: 4, defaultReps: "5-8", defaultRestSec: 120, isBodyweight: false },
  { id: "deadlift", name: "Deadlift", muscleGroup: "Back", equipment: "barbell", instructions: "Grip bar, brace, drive through floor, lock out hips. Keep back neutral.", defaultSets: 4, defaultReps: "5-8", defaultRestSec: 120, isBodyweight: false },
  { id: "bench_press", name: "Barbell Bench Press", muscleGroup: "Chest", equipment: "barbell", instructions: "Lower bar to chest with control, press up. Keep shoulder blades retracted.", defaultSets: 4, defaultReps: "5-8", defaultRestSec: 120, isBodyweight: false },
  { id: "row_barbell", name: "Barbell Row", muscleGroup: "Back", equipment: "barbell", instructions: "Hinge forward, row bar to lower ribs, squeeze back. Keep torso angle stable.", defaultSets: 4, defaultReps: "8-10", defaultRestSec: 90, isBodyweight: false },
  { id: "ohp_barbell", name: "Overhead Press (Barbell)", muscleGroup: "Shoulders", equipment: "barbell", instructions: "Press bar overhead from shoulders, brace core, avoid over-arching lower back.", defaultSets: 4, defaultReps: "5-8", defaultRestSec: 120, isBodyweight: false },

  // Cardio
  { id: "walking", name: "Brisk Walking", muscleGroup: "Cardio", equipment: "bodyweight", instructions: "Walk at a pace where talking is possible but slightly labored.", defaultSets: 1, defaultReps: "20-40 min", defaultRestSec: 0, isBodyweight: true },
  { id: "stair_climb", name: "Stair Climbing", muscleGroup: "Cardio", equipment: "bodyweight", instructions: "Climb stairs steadily. Great for legs and cardio.", defaultSets: 1, defaultReps: "10-20 min", defaultRestSec: 0, isBodyweight: true },
];

export interface WorkoutDay {
  name: string;
  exercises: string[]; // exercise ids
}

export interface WorkoutTemplate {
  name: string;
  split: string;
  description: string;
  days: WorkoutDay[];
}

/**
 * Generate a workout template based on goal, experience, gym access,
 * and days per week. Returns beginner-friendly full-body, upper/lower,
 * or push/pull/legs templates. Always accounts for rest.
 */
export function generateWorkoutPlan(params: {
  goal: FitnessGoal;
  experience: "beginner" | "intermediate" | "advanced";
  gymAccess: boolean;
  daysPerWeek: number;
}): WorkoutTemplate {
  const { goal, experience, gymAccess, daysPerWeek } = params;

  // Choose exercise pool by equipment
  const pool = gymAccess
    ? EXERCISE_LIBRARY
    : EXERCISE_LIBRARY.filter((e) => e.equipment === "bodyweight" || e.equipment === "band");

  const get = (id: string) => pool.find((e) => e.id === id)?.id;
  const has = (id: string) => pool.some((e) => e.id === id);

  // Full-body for beginners or <=3 days
  if (experience === "beginner" || daysPerWeek <= 3) {
    const dayA: string[] = [];
    const dayB: string[] = [];
    if (has("squat") && gymAccess) dayA.push("squat"); else if (has("squat_bw")) dayA.push("squat_bw");
    if (has("bench_press") && gymAccess) dayA.push("bench_press"); else if (has("pushup")) dayA.push("pushup");
    if (has("row_barbell") && gymAccess) dayA.push("row_barbell"); else if (has("db_row")) dayA.push("db_row");
    if (has("plank")) dayA.push("plank");

    if (has("deadlift") && gymAccess) dayB.push("deadlift"); else if (has("db_ldl")) dayB.push("db_ldl");
    if (has("db_ohp") && gymAccess) dayB.push("db_ohp"); else if (has("pushup")) dayB.push("pushup");
    if (has("db_row")) dayB.push("db_row"); else if (has("lunge")) dayB.push("lunge");
    if (has("glute_bridge")) dayB.push("glute_bridge");
    if (has("stair_climb")) dayB.push("stair_climb");

    return {
      name: `Full Body (${goal === "muscle_gain" ? "Strength" : "Conditioning"})`,
      split: "Full Body A/B",
      description: "Two alternating full-body sessions. Ideal for beginners — trains all muscles, allows recovery. Add cardio on off days.",
      days: [
        { name: "Workout A", exercises: dayA.filter(Boolean) },
        { name: "Workout B", exercises: dayB.filter(Boolean) },
      ],
    };
  }

  // Upper/Lower for 4 days
  if (daysPerWeek <= 4) {
    return {
      name: "Upper / Lower Split",
      split: "Upper/Lower",
      description: "Four sessions: two upper, two lower. Good balance of volume and recovery for intermediates.",
      days: [
        { name: "Upper A", exercises: gymAccess ? ["bench_press", "row_barbell", "db_ohp", "db_curl"] : ["pushup", "db_row", "db_ohp", "db_curl"].filter(has) },
        { name: "Lower A", exercises: gymAccess ? ["squat", "db_ldl", "lunge", "plank"] : ["squat_bw", "db_ldl", "lunge", "plank"].filter(has) },
        { name: "Upper B", exercises: gymAccess ? ["db_press", "deadlift", "db_lateral_raise", "db_curl"] : ["pushup", "db_row", "db_lateral_raise", "db_curl"].filter(has) },
        { name: "Lower B", exercises: gymAccess ? ["deadlift", "squat", "glute_bridge", "plank"] : ["db_ldl", "squat_bw", "glute_bridge", "plank"].filter(has) },
      ].map((d) => ({ ...d, exercises: d.exercises.filter((e) => has(e)) })),
    };
  }

  // Push/Pull/Legs for 5-6 days
  return {
    name: "Push / Pull / Legs",
    split: "PPL",
    description: "Six sessions across push, pull, and legs. Higher frequency — suited for advanced lifters with good recovery.",
    days: [
      { name: "Push", exercises: gymAccess ? ["bench_press", "ohp_barbell", "db_lateral_raise", "db_press"] : ["pushup", "wall_pushup", "db_ohp"].filter(has).filter(Boolean) },
      { name: "Pull", exercises: gymAccess ? ["row_barbell", "deadlift", "db_row", "db_curl"] : ["db_row", "db_curl"].filter(has).filter(Boolean) },
      { name: "Legs", exercises: gymAccess ? ["squat", "db_ldl", "lunge", "glute_bridge"] : ["squat_bw", "lunge", "glute_bridge", "step_up"].filter(has).filter(Boolean) },
    ].map((d) => ({ ...d, exercises: d.exercises.filter((e) => has(e)) })),
  };
}

/** Suggested substitution for a given exercise id (simpler variant). */
export function substituteFor(exerciseId: string): ExerciseTemplate | undefined {
  const subs: Record<string, string> = {
    pushup: "wall_pushup",
    squat: "squat_bw",
    squat_bw: "glute_bridge",
    lunge: "step_up",
  };
  const subId = subs[exerciseId];
  if (!subId) return undefined;
  return EXERCISE_LIBRARY.find((e) => e.id === subId);
}
