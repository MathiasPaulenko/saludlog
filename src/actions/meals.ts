"use server";

import { format } from "date-fns";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { foods, mealItems, meals } from "@/db/schema";
import type { ActionResult } from "@/lib/types";

const mealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  notes: z.string().trim().max(500).optional(),
  items: z
    .array(
      z.object({
        foodId: z.number().int().positive(),
        amount: z.number().positive(),
      }),
    )
    .min(1, "Agregá al menos un alimento"),
});

const idSchema = z.number().int().positive();

function revalidateMeals() {
  revalidatePath("/meals");
  revalidatePath("/");
}

export async function logMeal(input: unknown): Promise<ActionResult> {
  const parsed = mealSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const foodIds = parsed.data.items.map((i) => i.foodId);
  const found = db
    .select({ id: foods.id })
    .from(foods)
    .where(inArray(foods.id, foodIds))
    .all();
  if (found.length !== new Set(foodIds).size) {
    return { ok: false, error: "Algún alimento no existe" };
  }

  const { date, type, notes, items } = parsed.data;
  db.transaction((tx) => {
    const meal = tx
      .insert(meals)
      .values({ date, type, notes: notes || null })
      .returning({ id: meals.id })
      .get();
    if (!meal) throw new Error("Failed to insert meal");
    tx.insert(mealItems)
      .values(items.map((i) => ({ mealId: meal.id, ...i })))
      .run();
  });

  revalidateMeals();
  return { ok: true };
}

export async function updateMeal(
  mealId: number,
  input: unknown,
): Promise<ActionResult> {
  if (!idSchema.safeParse(mealId).success) {
    return { ok: false, error: "ID inválido" };
  }
  const parsed = mealSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const { date, type, notes, items } = parsed.data;
  db.transaction((tx) => {
    tx.update(meals)
      .set({ date, type, notes: notes || null })
      .where(eq(meals.id, mealId))
      .run();
    tx.delete(mealItems).where(eq(mealItems.mealId, mealId)).run();
    tx.insert(mealItems)
      .values(items.map((i) => ({ mealId, ...i })))
      .run();
  });

  revalidateMeals();
  return { ok: true };
}

export async function deleteMeal(mealId: number): Promise<void> {
  if (!idSchema.safeParse(mealId).success) return;
  db.delete(meals).where(eq(meals.id, mealId)).run();
  revalidateMeals();
}

export async function repeatMeal(mealId: number): Promise<void> {
  if (!idSchema.safeParse(mealId).success) return;

  const meal = db.select().from(meals).where(eq(meals.id, mealId)).get();
  if (!meal) return;
  const items = db
    .select()
    .from(mealItems)
    .where(eq(mealItems.mealId, mealId))
    .all();

  const today = format(new Date(), "yyyy-MM-dd");
  db.transaction((tx) => {
    const copy = tx
      .insert(meals)
      .values({ date: today, type: meal.type, notes: meal.notes })
      .returning({ id: meals.id })
      .get();
    if (!copy) throw new Error("Failed to copy meal");
    if (items.length > 0) {
      tx.insert(mealItems)
        .values(
          items.map((i) => ({
            mealId: copy.id,
            foodId: i.foodId,
            amount: i.amount,
          })),
        )
        .run();
    }
  });

  revalidateMeals();
  redirect(`/meals?date=${today}`);
}
