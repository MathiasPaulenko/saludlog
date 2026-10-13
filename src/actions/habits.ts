"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { habitLogs, habits } from "@/db/schema";
import { actionStrings } from "@/lib/i18n";
import type { ActionResult } from "@/lib/types";

const idSchema = z.number().int().positive();

const habitSchema = z.object({
  name: z.string().trim().min(1),
  unit: z.enum(["check", "count", "hours", "ml"]),
  targetDaily: z.number().positive().optional(),
});

const logSchema = z.object({
  habitId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  value: z.number().min(0),
});

function revalidateHabits() {
  revalidatePath("/habits");
  revalidatePath("/");
}

export async function logHabitValue(input: unknown): Promise<ActionResult> {
  const s = await actionStrings();
  const parsed = logSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: s.invalidData };

  const { habitId, date, value } = parsed.data;
  db.insert(habitLogs)
    .values({ habitId, date, value })
    .onConflictDoUpdate({
      target: [habitLogs.habitId, habitLogs.date],
      set: { value },
    })
    .run();

  revalidateHabits();
  return { ok: true };
}

export async function createHabit(input: unknown): Promise<ActionResult> {
  const s = await actionStrings();
  const parsed = habitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: s.invalidData };

  const max = db
    .select({ sortOrder: habits.sortOrder })
    .from(habits)
    .orderBy(asc(habits.sortOrder))
    .all()
    .at(-1)?.sortOrder;

  db.insert(habits)
    .values({ ...parsed.data, sortOrder: (max ?? 0) + 1 })
    .run();

  revalidateHabits();
  return { ok: true };
}

export async function setHabitActive(
  habitId: number,
  active: boolean,
): Promise<ActionResult> {
  const s = await actionStrings();
  if (!idSchema.safeParse(habitId).success) {
    return { ok: false, error: s.invalidId };
  }
  db.update(habits).set({ active }).where(eq(habits.id, habitId)).run();
  revalidateHabits();
  return { ok: true };
}

export async function moveHabit(
  habitId: number,
  direction: "up" | "down",
): Promise<ActionResult> {
  const s = await actionStrings();
  if (!idSchema.safeParse(habitId).success) {
    return { ok: false, error: s.invalidId };
  }

  const all = db.select().from(habits).orderBy(asc(habits.sortOrder)).all();
  const index = all.findIndex((h) => h.id === habitId);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || swapIndex < 0 || swapIndex >= all.length) {
    return { ok: false, error: "No se puede mover" };
  }

  const a = all[index];
  const b = all[swapIndex];
  db.transaction((tx) => {
    tx.update(habits)
      .set({ sortOrder: b.sortOrder })
      .where(eq(habits.id, a.id))
      .run();
    tx.update(habits)
      .set({ sortOrder: a.sortOrder })
      .where(eq(habits.id, b.id))
      .run();
  });

  revalidateHabits();
  return { ok: true };
}

export async function deleteHabit(habitId: number): Promise<void> {
  if (!idSchema.safeParse(habitId).success) return;
  const log = db
    .select({ habitId: habitLogs.habitId })
    .from(habitLogs)
    .where(eq(habitLogs.habitId, habitId))
    .limit(1)
    .get();
  if (log) {
    // Tiene historial: desactivar en lugar de borrar para no perder datos
    db.update(habits).set({ active: false }).where(eq(habits.id, habitId)).run();
  } else {
    db.delete(habits).where(eq(habits.id, habitId)).run();
  }
  revalidateHabits();
}
