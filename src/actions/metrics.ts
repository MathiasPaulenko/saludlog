"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { bodyMetrics } from "@/db/schema";
import { actionStrings } from "@/lib/i18n";
import type { ActionResult } from "@/lib/types";

const metricSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  weightKg: z.number().positive("El peso es obligatorio"),
  bodyFatPct: z.number().min(0).max(100).optional(),
  waistCm: z.number().positive().optional(),
  notes: z.string().trim().max(500).optional(),
});

const idSchema = z.number().int().positive();

function revalidateMetrics() {
  revalidatePath("/metrics");
  revalidatePath("/");
}

export async function upsertMetric(input: unknown): Promise<ActionResult> {
  const s = await actionStrings();
  const parsed = metricSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: s.invalidData };

  const { date, weightKg, bodyFatPct, waistCm, notes } = parsed.data;
  db.insert(bodyMetrics)
    .values({
      date,
      weightKg,
      bodyFatPct: bodyFatPct ?? null,
      waistCm: waistCm ?? null,
      notes: notes || null,
    })
    .onConflictDoUpdate({
      target: bodyMetrics.date,
      set: {
        weightKg,
        bodyFatPct: bodyFatPct ?? null,
        waistCm: waistCm ?? null,
        notes: notes || null,
      },
    })
    .run();

  revalidateMetrics();
  return { ok: true };
}

export async function deleteMetric(id: number): Promise<void> {
  if (!idSchema.safeParse(id).success) return;
  db.delete(bodyMetrics).where(eq(bodyMetrics.id, id)).run();
  revalidateMetrics();
}
