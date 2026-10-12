import { desc } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { bodyMetrics, type BodyMetric } from "@/db/schema";

export async function listMetrics(limit = 90): Promise<BodyMetric[]> {
  await connection();
  return db
    .select()
    .from(bodyMetrics)
    .orderBy(desc(bodyMetrics.date))
    .limit(limit)
    .all();
}

export async function getLatestMetric(): Promise<BodyMetric | undefined> {
  await connection();
  return db
    .select()
    .from(bodyMetrics)
    .orderBy(desc(bodyMetrics.date))
    .limit(1)
    .get();
}
