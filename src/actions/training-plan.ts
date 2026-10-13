"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { routines, trainingPlanItems } from "@/db/schema";
import { actionStrings } from "@/lib/i18n";
import type { ActionResult } from "@/lib/types";

const addSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  title: z.string().trim().min(1).max(100),
  workoutType: z.enum(["gym", "cardio", "sport", "other"]).default("gym"),
  routineId: z.number().int().positive().optional(),
  durationMin: z.number().int().positive().optional(),
});

const idSchema = z.number().int().positive();

export async function addTrainingPlanItem(
  input: unknown,
): Promise<ActionResult> {
  const s = await actionStrings();
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: s.invalidData };

  const data = parsed.data;
  if (data.routineId != null) {
    const exists = db
      .select({ id: routines.id })
      .from(routines)
      .where(eq(routines.id, data.routineId))
      .get();
    if (!exists) return { ok: false, error: "Rutina no encontrada" };
  }

  const position =
    db
      .select({ id: trainingPlanItems.id })
      .from(trainingPlanItems)
      .where(eq(trainingPlanItems.dayOfWeek, data.dayOfWeek))
      .all().length;

  db.insert(trainingPlanItems)
    .values({
      dayOfWeek: data.dayOfWeek,
      title: data.title,
      workoutType: data.workoutType,
      routineId: data.routineId ?? null,
      durationMin: data.durationMin ?? null,
      position,
    })
    .run();
  revalidatePath("/workouts");
  return { ok: true };
}

export async function deleteTrainingPlanItem(id: number): Promise<void> {
  if (!idSchema.safeParse(id).success) return;
  db.delete(trainingPlanItems).where(eq(trainingPlanItems.id, id)).run();
  revalidatePath("/workouts");
}
