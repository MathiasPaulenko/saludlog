"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { mealPlanItems } from "@/db/schema";
import type { ActionResult } from "@/lib/types";

const addSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  foodId: z.number().int().positive(),
  amount: z.number().positive(),
});

const updateSchema = z.object({
  id: z.number().int().positive(),
  amount: z.number().positive(),
});

const idSchema = z.number().int().positive();

export async function addPlanItem(input: unknown): Promise<ActionResult> {
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };
  db.insert(mealPlanItems).values(parsed.data).run();
  revalidatePath("/plan");
  return { ok: true };
}

export async function updatePlanItem(input: unknown): Promise<ActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };
  db.update(mealPlanItems)
    .set({ amount: parsed.data.amount })
    .where(eq(mealPlanItems.id, parsed.data.id))
    .run();
  revalidatePath("/plan");
  return { ok: true };
}

export async function deletePlanItem(id: number): Promise<void> {
  if (!idSchema.safeParse(id).success) return;
  db.delete(mealPlanItems).where(eq(mealPlanItems.id, id)).run();
  revalidatePath("/plan");
}
