import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { join } from "path";
import * as schema from "./schema";

/**
 * Genera ~35 días de datos sintéticos coherentes entre sí:
 * días con menos horas de sueño tienen más kcal, semanas con más
 * entrenos tienden a bajar de peso. Sirve para verificar /insights.
 * Ejecuta con: npm run db:seed:demo
 */

const DAYS = 35;
const dbFile = process.env.DB_FILE ?? join(process.cwd(), "data", "saludlog.db");
const db = drizzle(new Database(dbFile), { schema });
const { meals, mealItems, workouts, workoutSets, bodyMetrics, habits, habitLogs, goals, foods } =
  schema;

const date = (i: number) => {
  const d = new Date();
  d.setDate(d.getDate() - i);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// PRNG determinístico para reproducibilidad
let s = 42;
const rand = () => ((s = (s * 1103515245 + 12345) % 2147483648), s / 2147483648);
const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

const allFoods = db.select().from(foods).all();
const allHabits = db.select().from(habits).all();
const habitByName = new Map(allHabits.map((h) => [h.name, h]));

// Limpia datos anteriores (conserva foods y hábitos del seed)
for (const t of [mealItems, meals, workoutSets, workouts, habitLogs, bodyMetrics, goals]) {
  db.delete(t as typeof meals).run();
}

db.insert(goals)
  .values([
    { key: "daily_kcal", value: 2200, active: true },
    { key: "daily_protein", value: 140, active: true },
    { key: "weekly_workouts", value: 4, active: true },
  ])
  .run();

let weight = 84.5;
for (let i = DAYS - 1; i >= 0; i--) {
  const d = date(i);

  // Sueño: ~1 de cada 5 días corto (<6h)
  const shortSleep = rand() < 0.2;
  const sleep = shortSleep ? 4.8 + rand() : 6.5 + rand() * 1.8;
  const sleepHabit = habitByName.get("Sueño");
  if (sleepHabit) {
    db.insert(habitLogs)
      .values({ habitId: sleepHabit.id, date: d, value: Math.round(sleep * 10) / 10 })
      .run();
  }

  const med = habitByName.get("Meditación");
  if (med && rand() < 0.75) db.insert(habitLogs).values({ habitId: med.id, date: d, value: 1 }).run();

  const agua = habitByName.get("Agua");
  if (agua && rand() < 0.85)
    db.insert(habitLogs).values({ habitId: agua.id, date: d, value: Math.round(1600 + rand() * 1200) }).run();

  const pasos = habitByName.get("Pasos");
  if (pasos && rand() < 0.8)
    db.insert(habitLogs).values({ habitId: pasos.id, date: d, value: Math.round(4000 + rand() * 7000) }).run();

  // Comidas: ~15% de días sin loggear; tras dormir poco come más
  if (rand() < 0.85) {
    const extra = shortSleep ? 1.2 : 1;
    const add = (
      type: "breakfast" | "lunch" | "dinner" | "snack",
      pairs: [string, number][],
    ) => {
      const meal = db.insert(meals).values({ date: d, type }).returning({ id: meals.id }).get();
      for (const [name, amount] of pairs) {
        const f = allFoods.find((x) => x.name === name);
        if (f && meal) db.insert(mealItems).values({ mealId: meal.id, foodId: f.id, amount }).run();
      }
    };
    add("breakfast", [
      ["Avena", 60 * extra],
      ["Leche entera", 200],
      ["Banana", 120],
    ]);
    add("lunch", [
      ["Pechuga de pollo", Math.round(160 + rand() * 60)],
      ["Arroz blanco (cocido)", Math.round(120 + rand() * 80)],
      ["Aceite de oliva", 10],
    ]);
    if (rand() < 0.7) {
      add("dinner", pick([
        [["Huevo", 120], ["Pan", Math.round(60 * extra)]],
        [["Yogur natural", 250], ["Manzana", 150]],
        [["Atún en lata", 100], ["Pasta (cocida)", Math.round(180 * extra)]],
      ]));
    }
  }

  // Entrenos: ~50% de los días
  const trained = rand() < 0.5;
  if (trained) {
    const type = pick(["gym", "gym", "cardio", "sport"] as const);
    const w = db
      .insert(workouts)
      .values({ date: d, type, durationMin: Math.round(35 + rand() * 45) })
      .returning({ id: workouts.id })
      .get();
    if (w && type === "gym") {
      for (const ex of [["Press banca", 60], ["Sentadilla", 80], ["Peso muerto", 100]] as const) {
        if (rand() < 0.8)
          db.insert(workoutSets).values({ workoutId: w.id, exercise: ex[0], sets: 4, reps: 8, weightKg: ex[1] }).run();
      }
    }
  }

  // Peso 2-3 veces por semana: baja más si entrenó esa "semana" (aprox por día)
  if (i % 3 === 0) {
    weight += (trained ? -0.12 : 0.05) + (rand() - 0.5) * 0.15;
    db.insert(bodyMetrics)
      .values({ date: d, weightKg: Math.round(weight * 10) / 10, bodyFatPct: Math.round((21 + (weight - 83) * 0.5) * 10) / 10 })
      .run();
  }
}

console.log(`seed:demo → ${DAYS} días de datos sintéticos`);
