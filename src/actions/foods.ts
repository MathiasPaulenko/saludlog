"use server";

import { eq, count } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { foods, mealItems } from "@/db/schema";
import type { ActionResult } from "@/lib/types";

const foodSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido"),
  kcal: z.coerce.number().min(0),
  protein: z.coerce.number().min(0),
  carbs: z.coerce.number().min(0),
  fat: z.coerce.number().min(0),
  baseAmount: z.coerce.number().positive(),
  baseUnit: z.enum(["g", "ml", "unit"]),
});

const idSchema = z.number().int().positive();

export async function createFood(input: unknown): Promise<ActionResult> {
  const parsed = foodSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const existing = db
    .select({ id: foods.id })
    .from(foods)
    .where(eq(foods.name, parsed.data.name))
    .all();
  if (existing.length > 0) {
    return { ok: false, error: "Ya existe un alimento con ese nombre" };
  }

  db.insert(foods).values({ ...parsed.data, source: "manual" }).run();
  revalidatePath("/foods");
  revalidatePath("/meals");
  return { ok: true };
}

export async function updateFood(
  id: number,
  input: unknown,
): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "ID inválido" };
  const parsed = foodSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  db.update(foods).set(parsed.data).where(eq(foods.id, id)).run();
  revalidatePath("/foods");
  revalidatePath("/meals");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteFood(id: number): Promise<ActionResult> {
  if (!idSchema.safeParse(id).success) return { ok: false, error: "ID inválido" };

  const usage = db
    .select({ value: count() })
    .from(mealItems)
    .where(eq(mealItems.foodId, id))
    .all()[0]?.value ?? 0;
  if (usage > 0) {
    return {
      ok: false,
      error: `No se puede eliminar: está en ${usage} comida${usage === 1 ? "" : "s"} registrada${usage === 1 ? "" : "s"}`,
    };
  }

  db.delete(foods).where(eq(foods.id, id)).run();
  revalidatePath("/foods");
  revalidatePath("/meals");
  return { ok: true };
}
