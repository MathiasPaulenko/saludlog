import type { HabitUnit, MealType, WorkoutType } from "./labels";

export type ActionResult = { ok: true } | { ok: false; error: string };

export interface MealItemInput {
  foodId: number;
  amount: number;
}

export interface MealInput {
  date: string;
  type: MealType;
  notes?: string;
  items: MealItemInput[];
}

export interface FoodInput {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  baseAmount: number;
  baseUnit: "g" | "ml" | "unit";
}

export interface WorkoutSetInput {
  exercise: string;
  sets: number;
  reps: number;
  weightKg?: number;
}

export interface WorkoutInput {
  date: string;
  type: WorkoutType;
  durationMin?: number;
  notes?: string;
  sets: WorkoutSetInput[];
}

export interface HabitInput {
  name: string;
  unit: HabitUnit;
  targetDaily?: number;
}

export interface MetricInput {
  date: string;
  weightKg: number;
  bodyFatPct?: number;
  waistCm?: number;
  notes?: string;
}

export interface GoalsInput {
  daily_kcal?: number;
  daily_protein?: number;
  weekly_workouts?: number;
}
