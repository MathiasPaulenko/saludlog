import { asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { foods, mealPlanItems } from "@/db/schema";
import type { MealType } from "@/lib/labels";
import { computeItemMacros, type Macros } from "@/lib/macros";

export interface PlanItem {
  id: number;
  foodName: string;
  amount: number;
  baseUnit: string;
  macros: Macros;
}

export type DayPlan = Record<MealType, PlanItem[]>;
/** 0 = lunes … 6 = domingo */
export type WeeklyPlan = Record<number, DayPlan>;

export async function getWeeklyPlan(): Promise<WeeklyPlan> {
  await connection();
  const rows = await db
    .select({ item: mealPlanItems, food: foods })
    .from(mealPlanItems)
    .innerJoin(foods, eq(mealPlanItems.foodId, foods.id))
    .orderBy(asc(mealPlanItems.id));

  const plan: WeeklyPlan = Object.fromEntries(
    Array.from({ length: 7 }, (_, d) => [
      d,
      {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      } satisfies DayPlan,
    ]),
  );

  for (const { item, food } of rows) {
    plan[item.dayOfWeek][item.mealType].push({
      id: item.id,
      foodName: food.name,
      amount: item.amount,
      baseUnit: food.baseUnit,
      macros: computeItemMacros(food, item.amount),
    });
  }
  return plan;
}
