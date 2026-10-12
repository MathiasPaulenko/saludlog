import { asc, eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { habitLogs, habits, type Habit, type HabitLog } from "@/db/schema";

export async function listHabits(activeOnly = true): Promise<Habit[]> {
  await connection();
  if (activeOnly) {
    return db
      .select()
      .from(habits)
      .where(eq(habits.active, true))
      .orderBy(asc(habits.sortOrder))
      .all();
  }
  return db.select().from(habits).orderBy(asc(habits.sortOrder)).all();
}

export async function getHabitLogsForDate(date: string): Promise<HabitLog[]> {
  await connection();
  return db.select().from(habitLogs).where(eq(habitLogs.date, date)).all();
}
