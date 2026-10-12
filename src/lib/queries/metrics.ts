import { and, asc, desc, gte, lte } from "drizzle-orm";
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

export async function getMetricsInRange(
  startDate: string,
  endDate: string,
): Promise<BodyMetric[]> {
  await connection();
  return db
    .select()
    .from(bodyMetrics)
    .where(
      and(gte(bodyMetrics.date, startDate), lte(bodyMetrics.date, endDate)),
    )
    .orderBy(asc(bodyMetrics.date))
    .all();
}

export async function getLastTwoMetricsUpTo(
  date: string,
): Promise<BodyMetric[]> {
  await connection();
  return db
    .select()
    .from(bodyMetrics)
    .where(lte(bodyMetrics.date, date))
    .orderBy(desc(bodyMetrics.date))
    .limit(2)
    .all();
}
