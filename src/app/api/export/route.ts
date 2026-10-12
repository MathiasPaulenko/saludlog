import { db } from "@/db";
import {
  bodyMetrics,
  foods,
  goals,
  habitLogs,
  habits,
  mealItems,
  meals,
  workouts,
  workoutSets,
} from "@/db/schema";

export async function GET() {
  const tables = {
    foods: db.select().from(foods).all(),
    meals: db.select().from(meals).all(),
    meal_items: db.select().from(mealItems).all(),
    workouts: db.select().from(workouts).all(),
    workout_sets: db.select().from(workoutSets).all(),
    body_metrics: db.select().from(bodyMetrics).all(),
    habits: db.select().from(habits).all(),
    habit_logs: db.select().from(habitLogs).all(),
    goals: db.select().from(goals).all(),
  };

  return Response.json(
    { version: 1, exportedAt: new Date().toISOString(), tables },
    {
      headers: {
        "Content-Disposition":
          'attachment; filename="saludlog-export.json"',
      },
    },
  );
}
