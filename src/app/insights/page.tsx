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
import { getLocale, t } from "@/lib/i18n";
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

const S = {
  es: {
    notEnoughTitle: "Todavía no hay datos suficientes",
    notEnoughDesc: (min: number) =>
      `Los insights aparecen con ${min}+ días registrados.`,
    progress: (days: number, missing: number) =>
      `Llevás ${days} ${days === 1 ? "día" : "días"} con datos. Faltan ${missing}. Seguí loggeando comidas, entrenos, hábitos y peso.`,
    ruleLabel: "Regla",
    insufficient: "Datos insuficientes en el período para esta regla.",
  },
  en: {
    notEnoughTitle: "Not enough data yet",
    notEnoughDesc: (min: number) =>
      `Insights appear with ${min}+ days logged.`,
    progress: (days: number, missing: number) =>
      `You have ${days} ${days === 1 ? "day" : "days"} with data. ${missing} to go. Keep logging meals, workouts, habits and weight.`,
    ruleLabel: "Rule",
    insufficient: "Insufficient data in the period for this rule.",
  },
};

export default function InsightsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <InsightsSection />
      </Suspense>
    </div>
  );
}

async function InsightsSection() {
  await connection();
  const locale = await getLocale();
  const s = t(S, locale);
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
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="text-base">{s.notEnoughTitle}</CardTitle>
            <CardDescription>{s.notEnoughDesc(MIN_DAYS)}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {s.progress(dataDays, MIN_DAYS - dataDays)}
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  const sleepHabit = activeHabits.find((h) => h.unit === "hours");
  const sleepLogs = sleepHabit
    ? habitLogs.filter((l) => l.habitId === sleepHabit.id)
    : [];

  const insights: (Insight | null)[] = [
    sleepKcalInsight(sleepLogs, dayTotals, locale),
    workoutsWeightInsight(rangeWorkouts, metrics, today, locale),
    habitConsistencyInsight(activeHabits, habitLogs, range30, today, locale),
  ];

  const TITLES = [
    { es: "Sueño y calorías", en: "Sleep and calories" },
    { es: "Entrenos y peso", en: "Workouts and weight" },
    { es: "Consistencia de hábitos", en: "Habit consistency" },
  ] as const;
  const RULES = [
    { es: "kcal promedio en días con sueño <6h vs ≥7h", en: "avg kcal on days with sleep <6h vs ≥7h" },
    {
      es: "delta de peso medio semanal en semanas con ≥3 vs <3 sesiones",
      en: "avg weekly weight delta on weeks with ≥3 vs <3 sessions",
    },
    {
      es: "adherencia media de 30 días vs tu hábito más consistente",
      en: "30-day average adherence vs your most consistent habit",
    },
  ] as const;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Insights</h1>
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {insights.map((i, idx) => (
          <Card key={TITLES[idx].en}>
            <CardHeader>
              <CardTitle className="text-base">{TITLES[idx][locale]}</CardTitle>
              <CardDescription>
                {s.ruleLabel}: {RULES[idx][locale]}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {i ? (
                <>
                  <p className="text-sm font-medium">{i.verdict}</p>
                  <p className="text-sm text-muted-foreground">{i.detail}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {s.insufficient}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
