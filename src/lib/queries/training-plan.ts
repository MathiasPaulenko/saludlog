import { asc } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { trainingPlanItems, type TrainingPlanItem } from "@/db/schema";

export type TrainingPlan = Record<number, TrainingPlanItem[]>;

export async function getTrainingPlan(): Promise<TrainingPlan> {
  await connection();
  const rows = await db
    .select()
    .from(trainingPlanItems)
    .orderBy(asc(trainingPlanItems.dayOfWeek), asc(trainingPlanItems.position));

  const plan: TrainingPlan = Object.fromEntries(
    Array.from({ length: 7 }, (_, d) => [d, [] as TrainingPlanItem[]]),
  );
  for (const row of rows) plan[row.dayOfWeek].push(row);
  return plan;
}
