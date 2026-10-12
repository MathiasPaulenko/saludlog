import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bodyMetrics,
  foods,
  habitLogs,
  habits,
  mealItems,
  meals,
  workouts,
  workoutSets,
} from "@/db/schema";

type Row = (string | number | null | undefined)[];

const csvCell = (v: string | number | null | undefined) => {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// BOM para que Excel respete UTF-8 al abrir el CSV
const toCsv = (header: string[], rows: Row[]) =>
  "﻿" +
  [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");

function csvResponse(filename: string, header: string[], rows: Row[]) {
  return new Response(toCsv(header, rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="saludlog-${filename}.csv"`,
    },
  });
}

export function GET(request: Request) {
  const domain = new URL(request.url).searchParams.get("domain");

  switch (domain) {
    case "foods": {
      const rows = db.select().from(foods).all();
      return csvResponse(
        "foods",
        ["name", "kcal", "protein", "carbs", "fat", "base_amount", "base_unit", "source"],
        rows.map((f) => [f.name, f.kcal, f.protein, f.carbs, f.fat, f.baseAmount, f.baseUnit, f.source]),
      );
    }
    case "meals": {
      const rows = db
        .select({ item: mealItems, food: foods, meal: meals })
        .from(mealItems)
        .innerJoin(meals, eq(mealItems.mealId, meals.id))
        .innerJoin(foods, eq(mealItems.foodId, foods.id))
        .all();
      return csvResponse(
        "meals",
        ["date", "type", "food", "amount", "notes"],
        rows.map((r) => [r.meal.date, r.meal.type, r.food.name, r.item.amount, r.meal.notes]),
      );
    }
    case "workouts": {
      const rows = db
        .select({ set: workoutSets, workout: workouts })
        .from(workoutSets)
        .rightJoin(workouts, eq(workoutSets.workoutId, workouts.id))
        .all();
      return csvResponse(
        "workouts",
        ["date", "type", "duration_min", "exercise", "sets", "reps", "weight_kg", "notes"],
        rows.map((r) => [
          r.workout.date,
          r.workout.type,
          r.workout.durationMin,
          r.set?.exercise,
          r.set?.sets,
          r.set?.reps,
          r.set?.weightKg,
          r.workout.notes,
        ]),
      );
    }
    case "habits": {
      const rows = db
        .select({ log: habitLogs, habit: habits })
        .from(habitLogs)
        .innerJoin(habits, eq(habitLogs.habitId, habits.id))
        .all();
      return csvResponse(
        "habits",
        ["date", "habit", "value", "unit"],
        rows.map((r) => [r.log.date, r.habit.name, r.log.value, r.habit.unit]),
      );
    }
    case "metrics": {
      const rows = db.select().from(bodyMetrics).all();
      return csvResponse(
        "metrics",
        ["date", "weight_kg", "body_fat_pct", "waist_cm", "notes"],
        rows.map((m) => [m.date, m.weightKg, m.bodyFatPct, m.waistCm, m.notes]),
      );
    }
    default:
      return Response.json(
        { error: "domain inválido (foods|meals|workouts|habits|metrics)" },
        { status: 400 },
      );
  }
}
