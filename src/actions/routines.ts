"use server";

import { asc, eq } from "drizzle-orm";
import { format } from "date-fns";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { routineItems, routines, workouts, workoutSets } from "@/db/schema";
import { actionStrings } from "@/lib/i18n";
import type { ActionResult } from "@/lib/types";

const itemSchema = z.object({
  exercise: z.string().trim().min(1),
  exerciseId: z.number().int().positive().optional(),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  weightKg: z.number().min(0).optional(),
});

const routineSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(100),
  notes: z.string().trim().max(500).optional(),
  items: z.array(itemSchema).min(1, "La rutina necesita al menos un ejercicio"),
});

const idSchema = z.number().int().positive();

function revalidateWorkouts() {
  revalidatePath("/workouts");
  revalidatePath("/");
}

export async function saveRoutine(
  routineId: number | null,
  input: unknown,
): Promise<ActionResult> {
  const s = await actionStrings();
  const parsed = routineSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? s.invalidData };
  }
  if (routineId != null && !idSchema.safeParse(routineId).success) {
    return { ok: false, error: s.invalidId };
  }

  const { name, notes, items } = parsed.data;
  const existing = db
    .select({ id: routines.id })
    .from(routines)
    .where(eq(routines.name, name))
    .get();
  if (existing && existing.id !== routineId) {
    return { ok: false, error: s.routineNameTaken };
  }

  db.transaction((tx) => {
    const id =
      routineId ??
      tx
        .insert(routines)
        .values({ name, notes: notes || null })
        .returning({ id: routines.id })
        .get().id;
    if (routineId != null) {
      tx.update(routines)
        .set({ name, notes: notes || null })
        .where(eq(routines.id, routineId))
        .run();
      tx.delete(routineItems).where(eq(routineItems.routineId, routineId)).run();
    }
    tx.insert(routineItems)
      .values(
        items.map((it, i) => ({
          routineId: id,
          position: i,
          exercise: it.exercise,
          exerciseId: it.exerciseId ?? null,
          sets: it.sets,
          reps: it.reps,
          weightKg: it.weightKg ?? null,
        })),
      )
      .run();
  });

  revalidateWorkouts();
  return { ok: true };
}

export async function deleteRoutine(routineId: number): Promise<void> {
  if (!idSchema.safeParse(routineId).success) return;
  db.delete(routines).where(eq(routines.id, routineId)).run();
  revalidateWorkouts();
}

/** Crea un entreno "gym" con las series de la rutina prellenadas. */
export async function applyRoutine(
  routineId: number,
  date?: string,
): Promise<ActionResult> {
  const s = await actionStrings();
  if (!idSchema.safeParse(routineId).success) {
    return { ok: false, error: s.invalidId };
  }
  const d =
    date && /^\d{4}-\d{2}-\d{2}$/.test(date)
      ? date
      : format(new Date(), "yyyy-MM-dd");

  const items = db
    .select()
    .from(routineItems)
    .where(eq(routineItems.routineId, routineId))
    .orderBy(asc(routineItems.position))
    .all();
  const routine = db
    .select()
    .from(routines)
    .where(eq(routines.id, routineId))
    .get();
  if (!routine || items.length === 0) {
    return { ok: false, error: s.routineNotFound };
  }

  const workout = db
    .insert(workouts)
    .values({ date: d, type: "gym", notes: routine.name })
    .returning({ id: workouts.id })
    .get();
  db.insert(workoutSets)
    .values(
      items.map((it) => ({
        workoutId: workout.id,
        exercise: it.exercise,
        exerciseId: it.exerciseId,
        sets: it.sets,
        reps: it.reps,
        weightKg: it.weightKg,
      })),
    )
    .run();

  revalidateWorkouts();
  return { ok: true };
}
