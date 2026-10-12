import { asc } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { foods, type Food } from "@/db/schema";

export async function listFoods(): Promise<Food[]> {
  await connection();
  return db.select().from(foods).orderBy(asc(foods.name)).all();
}
