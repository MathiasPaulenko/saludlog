import { asc, eq, inArray } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import {
  foods,
  mealItems,
  meals,
  type Food,
  type Meal,
  type MealItem,
} from "@/db/schema";
import { computeMealMacros, type Macros } from "@/lib/macros";

export interface MealWithItems extends Meal {
  items: { item: MealItem; food: Food }[];
}

export async function getMealsForDate(date: string): Promise<MealWithItems[]> {
  await connection();
  const dayMeals = await db
    .select()
    .from(meals)
    .where(eq(meals.date, date))
    .orderBy(asc(meals.createdAt));

  if (dayMeals.length === 0) return [];

  const items = await db
    .select({ item: mealItems, food: foods })
    .from(mealItems)
    .innerJoin(foods, eq(mealItems.foodId, foods.id))
    .where(
      inArray(
        mealItems.mealId,
        dayMeals.map((m) => m.id),
      ),
    );

  return dayMeals.map((meal) => ({
    ...meal,
    items: items.filter((i) => i.item.mealId === meal.id),
  }));
}

export async function getDayTotals(date: string): Promise<Macros> {
  const dayMeals = await getMealsForDate(date);
  const items = dayMeals.flatMap((m) =>
    m.items.map((i) => ({ food: i.food, amount: i.item.amount })),
  );
  return computeMealMacros(items);
}
