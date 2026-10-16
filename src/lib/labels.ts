import type { Meal } from "@/db/schema";
import type { Locale } from "@/lib/i18n-shared";

export const MEAL_TYPES = [
  "breakfast",
  "mid_morning",
  "lunch",
  "pre_workout",
  "post_workout",
  "snack",
  "dinner",
] as const;
export type MealType = Meal["type"];

export const MEAL_TYPE_LABELS: Record<Locale, Record<MealType, string>> = {
  es: {
    breakfast: "Desayuno",
    mid_morning: "Media mañana",
    lunch: "Almuerzo",
    pre_workout: "Pre-entreno",
    post_workout: "Post-entreno",
    dinner: "Cena",
    snack: "Merienda",
  },
  en: {
    breakfast: "Breakfast",
    mid_morning: "Mid-morning",
    lunch: "Lunch",
    pre_workout: "Pre-workout",
    post_workout: "Post-workout",
    dinner: "Dinner",
    snack: "Snack",
  },
};

export const BASE_UNIT_LABELS: Record<string, string> = {
  g: "g",
  ml: "ml",
  unit: "u",
};

export const WORKOUT_TYPES = ["gym", "cardio", "sport", "other"] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export const WORKOUT_TYPE_LABELS: Record<Locale, Record<WorkoutType, string>> = {
  es: { gym: "Gym", cardio: "Cardio", sport: "Deporte", other: "Otro" },
  en: { gym: "Gym", cardio: "Cardio", sport: "Sport", other: "Other" },
};

export const HABIT_UNITS = ["check", "count", "hours", "ml"] as const;
export type HabitUnit = (typeof HABIT_UNITS)[number];

export const HABIT_UNIT_LABELS: Record<Locale, Record<HabitUnit, string>> = {
  es: { check: "Check", count: "Cantidad", hours: "Horas", ml: "ml" },
  en: { check: "Check", count: "Count", hours: "Hours", ml: "ml" },
};

export const HABIT_UNIT_SUFFIX: Record<HabitUnit, string> = {
  check: "",
  count: "",
  hours: "h",
  ml: "ml",
};

export const GOAL_LABELS: Record<Locale, Record<string, string>> = {
  es: {
    daily_kcal: "Calorías diarias (kcal)",
    daily_protein: "Proteína diaria (g)",
    weekly_workouts: "Entrenos por semana",
  },
  en: {
    daily_kcal: "Daily calories (kcal)",
    daily_protein: "Daily protein (g)",
    weekly_workouts: "Workouts per week",
  },
};

export const WEEKDAY_LABELS: Record<Locale, string[]> = {
  es: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
};
