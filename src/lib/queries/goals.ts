import { eq } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { goals } from "@/db/schema";

export async function getGoals(): Promise<Record<string, number>> {
  await connection();
  const rows = await db
    .select()
    .from(goals)
    .where(eq(goals.active, true))
    .all();
  return Object.fromEntries(rows.map((g) => [g.key, g.value]));
}
