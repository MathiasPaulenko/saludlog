import { asc } from "drizzle-orm";
import { connection } from "next/server";
import { db } from "@/db";
import { exercises, type Exercise } from "@/db/schema";

export type ExerciseOption = Pick<Exercise, "id" | "name" | "primaryMuscles" | "equipment">;

export async function listExercises(): Promise<ExerciseOption[]> {
  await connection();
  return db
    .select({
      id: exercises.id,
      name: exercises.name,
      primaryMuscles: exercises.primaryMuscles,
      equipment: exercises.equipment,
    })
    .from(exercises)
    .orderBy(asc(exercises.name));
}
