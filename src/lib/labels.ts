import type { Meal } from "@/db/schema";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = Meal["type"];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Merienda",
};

export const BASE_UNIT_LABELS: Record<string, string> = {
  g: "g",
  ml: "ml",
  unit: "u",
};

export const WORKOUT_TYPES = ["gym", "cardio", "sport", "other"] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  gym: "Gym",
  cardio: "Cardio",
  sport: "Deporte",
  other: "Otro",
};

export const HABIT_UNITS = ["check", "count", "hours", "ml"] as const;
export type HabitUnit = (typeof HABIT_UNITS)[number];

export const HABIT_UNIT_LABELS: Record<HabitUnit, string> = {
  check: "Check",
  count: "Cantidad",
  hours: "Horas",
  ml: "ml",
};

export const HABIT_UNIT_SUFFIX: Record<HabitUnit, string> = {
  check: "",
  count: "",
  hours: "h",
  ml: "ml",
};

export const GOAL_LABELS: Record<string, string> = {
  daily_kcal: "Calorías diarias (kcal)",
  daily_protein: "Proteína diaria (g)",
  weekly_workouts: "Entrenos por semana",
};
