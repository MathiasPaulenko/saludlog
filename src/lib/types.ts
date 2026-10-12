import type { MealType } from "./labels";

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
