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
