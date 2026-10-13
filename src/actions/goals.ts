"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { actionStrings } from "@/lib/i18n";
import type { ActionResult } from "@/lib/types";

const GOAL_KEYS = ["daily_kcal", "daily_protein", "weekly_workouts"] as const;

const goalsSchema = z.record(
  z.enum(GOAL_KEYS),
  z.coerce.number().positive().optional(),
);

export async function saveGoals(input: unknown): Promise<ActionResult> {
  const s = await actionStrings();
  const parsed = goalsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: s.invalidData };

  for (const key of GOAL_KEYS) {
    const value = parsed.data[key];
    if (value !== undefined) {
      db.insert(goals)
        .values({ key, value, active: true })
        .onConflictDoUpdate({
          target: goals.key,
          set: { value, active: true },
        })
        .run();
    } else {
      // campo vacío = meta desactivada
      db.update(goals).set({ active: false }).where(eq(goals.key, key)).run();
    }
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true };
}

export async function saveGoalsForm(formData: FormData): Promise<void> {
  const input: Record<string, number | undefined> = {};
  for (const key of GOAL_KEYS) {
    const raw = formData.get(key);
    const num = typeof raw === "string" ? Number(raw) : NaN;
    input[key] = raw !== null && raw !== "" && num > 0 ? num : undefined;
  }
  await saveGoals(input);
}
