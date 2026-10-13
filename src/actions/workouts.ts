"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { workouts, workoutSets } from "@/db/schema";
import type { ActionResult } from "@/lib/types";

const workoutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  type: z.enum(["gym", "cardio", "sport", "other"]),
  durationMin: z.number().int().positive().optional(),
  notes: z.string().trim().max(500).optional(),
  sets: z
    .array(
      z.object({
        exercise: z.string().trim().min(1),
        exerciseId: z.number().int().positive().optional(),
        sets: z.number().int().positive(),
        reps: z.number().int().positive(),
        weightKg: z.number().min(0).optional(),
      }),
    )
    .default([]),
});

const idSchema = z.number().int().positive();

function revalidateWorkouts() {
  revalidatePath("/workouts");
  revalidatePath("/");
}

export async function logWorkout(input: unknown): Promise<ActionResult> {
  const parsed = workoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const { date, type, durationMin, notes, sets } = parsed.data;
  db.transaction((tx) => {
    const workout = tx
      .insert(workouts)
      .values({ date, type, durationMin, notes: notes || null })
      .returning({ id: workouts.id })
      .get();
    if (!workout) throw new Error("Failed to insert workout");
    if (sets.length > 0) {
      tx.insert(workoutSets)
        .values(sets.map((s) => ({ workoutId: workout.id, ...s })))
        .run();
    }
  });

  revalidateWorkouts();
  return { ok: true };
}

export async function updateWorkout(
  workoutId: number,
  input: unknown,
): Promise<ActionResult> {
  if (!idSchema.safeParse(workoutId).success) {
    return { ok: false, error: "ID inválido" };
  }
  const parsed = workoutSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };

  const { date, type, durationMin, notes, sets } = parsed.data;
  db.transaction((tx) => {
    tx.update(workouts)
      .set({ date, type, durationMin, notes: notes || null })
      .where(eq(workouts.id, workoutId))
      .run();
    tx.delete(workoutSets).where(eq(workoutSets.workoutId, workoutId)).run();
    if (sets.length > 0) {
      tx.insert(workoutSets)
        .values(sets.map((s) => ({ workoutId, ...s })))
        .run();
    }
  });

  revalidateWorkouts();
  return { ok: true };
}

export async function deleteWorkout(workoutId: number): Promise<void> {
  if (!idSchema.safeParse(workoutId).success) return;
  db.delete(workouts).where(eq(workouts.id, workoutId)).run();
  revalidateWorkouts();
}
