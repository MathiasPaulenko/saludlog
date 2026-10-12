import { addDays, format } from "date-fns";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  habitConsistencyInsight,
  sleepKcalInsight,
  workoutsWeightInsight,
  type Insight,
} from "@/lib/insights";
import { getHabitLogsInRange, listHabits } from "@/lib/queries/habits";
import { getDayTotalsInRange } from "@/lib/queries/meals";
import { getMetricsInRange } from "@/lib/queries/metrics";
import { getWorkoutsInRange } from "@/lib/queries/workouts";

const MIN_DAYS = 14;

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
      <Suspense fallback={<p className="text-muted-foreground">Cargando…</p>}>
        <InsightsSection />
      </Suspense>
    </div>
  );
}

async function InsightsSection() {
  await connection();
  const today = format(new Date(), "yyyy-MM-dd");
  const start = format(addDays(new Date(), -89), "yyyy-MM-dd");
  const range30 = Array.from({ length: 30 }, (_, i) =>
    format(addDays(new Date(), i - 29), "yyyy-MM-dd"),
  );

  const [dayTotals, habitLogs, activeHabits, metrics, rangeWorkouts] =
    await Promise.all([
      getDayTotalsInRange(start, today),
      getHabitLogsInRange(start, today),
      listHabits(true),
      getMetricsInRange(start, today),
      getWorkoutsInRange(start, today),
    ]);

  const dataDays = new Set([
    ...dayTotals.map((d) => d.date),
    ...habitLogs.map((l) => l.date),
    ...metrics.map((m) => m.date),
    ...rangeWorkouts.map((w) => w.date),
  ]).size;

  if (dataDays < MIN_DAYS) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Todavía no hay datos suficientes</CardTitle>
          <CardDescription>
            Los insights aparecen con {MIN_DAYS}+ días registrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Llevás {dataDays} día{dataDays === 1 ? "" : "s"} con datos. Faltan{" "}
            {MIN_DAYS - dataDays}. Seguí loggeando comidas, entrenos, hábitos y
            peso.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sleepHabit = activeHabits.find((h) => h.unit === "hours");
  const sleepLogs = sleepHabit
    ? habitLogs.filter((l) => l.habitId === sleepHabit.id)
    : [];

  const insights: (Insight | null)[] = [
    sleepKcalInsight(sleepLogs, dayTotals),
    workoutsWeightInsight(rangeWorkouts, metrics, today),
    habitConsistencyInsight(activeHabits, habitLogs, range30, today),
  ];

  const RULES = [
    "kcal promedio en días con sueño <6h vs ≥7h",
    "delta de peso medio semanal en semanas con ≥3 vs <3 sesiones",
    "adherencia media de 30 días vs tu hábito más consistente",
  ];
  const TITLES = ["Sueño y calorías", "Entrenos y peso", "Consistencia de hábitos"];

  return (
    <div className="grid max-w-4xl gap-4 lg:grid-cols-2">
      {insights.map((i, idx) => (
        <Card key={TITLES[idx]}>
          <CardHeader>
            <CardTitle className="text-base">{TITLES[idx]}</CardTitle>
            <CardDescription>Regla: {RULES[idx]}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {i ? (
              <>
                <p className="text-sm font-medium">{i.verdict}</p>
                <p className="text-sm text-muted-foreground">{i.detail}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Datos insuficientes en el período para esta regla.
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
