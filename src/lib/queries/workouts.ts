import { and, asc, gte, inArray, lte } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import {
  workouts,
  workoutSets,
  type Workout,
  type WorkoutSet,
} from "@/db/schema";

export interface WorkoutWithSets extends Workout {
  sets: WorkoutSet[];
}

export async function getWorkoutsInRange(
  startDate: string,
  endDate: string,
): Promise<WorkoutWithSets[]> {
  await connection();
  const rows = await db
    .select()
    .from(workouts)
    .where(and(gte(workouts.date, startDate), lte(workouts.date, endDate)))
    .orderBy(asc(workouts.date), asc(workouts.createdAt));

  if (rows.length === 0) return [];

  const sets = await db
    .select()
    .from(workoutSets)
    .where(
      inArray(
        workoutSets.workoutId,
        rows.map((w) => w.id),
      ),
    );

  return rows.map((w) => ({
    ...w,
    sets: sets.filter((s) => s.workoutId === w.id),
  }));
}

export async function getWorkoutsForDate(
  date: string,
): Promise<WorkoutWithSets[]> {
  return getWorkoutsInRange(date, date);
}
