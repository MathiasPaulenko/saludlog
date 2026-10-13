import { asc } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import {
  routineItems,
  routines,
  type Routine,
  type RoutineItem,
} from "@/db/schema";

export interface RoutineWithItems extends Routine {
  items: RoutineItem[];
}

export async function listRoutines(): Promise<RoutineWithItems[]> {
  await connection();
  const rows = await db.select().from(routines).orderBy(asc(routines.name));
  if (rows.length === 0) return [];
  const items = await db
    .select()
    .from(routineItems)
    .orderBy(asc(routineItems.position));
  return rows.map((r) => ({
    ...r,
    items: items.filter((i) => i.routineId === r.id),
  }));
}
