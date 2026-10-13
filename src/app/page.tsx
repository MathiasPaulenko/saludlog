import { addDays, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import {
  HabitsChart,
  MacrosChart,
  WeightChart,
  WorkoutsChart,
} from "@/components/dashboard/charts";
import { RangeNav } from "@/components/dashboard/range-nav";
import { HabitRow } from "@/components/habits/habit-row";
import { MealFormDialog } from "@/components/meals/meal-form-dialog";
import { MetricFormDialog } from "@/components/metrics/metric-form-dialog";
import { WorkoutFormDialog } from "@/components/workouts/workout-form-dialog";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { habitStats, weekBuckets, weightSeries } from "@/lib/chart-data";
import { WORKOUT_TYPE_LABELS } from "@/lib/labels";
import { roundMacros } from "@/lib/macros";
import { listExercises } from "@/lib/queries/exercises";
import { listFoods } from "@/lib/queries/foods";
import { getGoals } from "@/lib/queries/goals";
import {
  getHabitLogsForDate,
  getHabitLogsInRange,
  listHabits,
} from "@/lib/queries/habits";
import { getDayTotals, getDayTotalsInRange } from "@/lib/queries/meals";
import {
  getLastTwoMetricsUpTo,
  getMetricsInRange,
} from "@/lib/queries/metrics";
import {
  getWorkoutsForDate,
  getWorkoutsInRange,
} from "@/lib/queries/workouts";

export default function TodayPage({ searchParams }: PageProps<"/">) {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<p className="text-muted-foreground">Cargando…</p>}>
        <DayCards searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={null}>
        <TrendsSection searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function parseDate(raw: unknown): string {
  return typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? raw
    : format(new Date(), "yyyy-MM-dd");
}

async function DayCards({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  await connection();
  const { date: raw } = await searchParams;
  const date = parseDate(raw);
  const today = format(new Date(), "yyyy-MM-dd");
  const isToday = date === today;

  const [
    totals,
    foods,
    goals,
    dayWorkouts,
    activeHabits,
    logs,
    lastTwo,
    exercises,
  ] = await Promise.all([
    getDayTotals(date),
    listFoods(),
    getGoals(),
    getWorkoutsForDate(date),
    listHabits(true),
    getHabitLogsForDate(date),
    getLastTwoMetricsUpTo(date),
    listExercises(),
  ]);

  const t = roundMacros(totals);
  const valueByHabit = new Map(logs.map((l) => [l.habitId, l.value]));
  const doneCount = activeHabits.filter((h) => {
    const v = valueByHabit.get(h.id) ?? 0;
    return h.unit === "check"
      ? v >= 1
      : h.targetDaily != null
        ? v >= h.targetDaily
        : v > 0;
  }).length;
  const totalMin = dayWorkouts.reduce(
    (sum, w) => sum + (w.durationMin ?? 0),
    0,
  );
  const [latest, previous] = lastTwo;
  const delta =
    latest && previous ? latest.weightKg - previous.weightKg : null;

  const rawLabel = format(parseISO(date), "EEEE d 'de' MMMM", {
    locale: es,
  });
  const dateLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isToday ? "Hoy" : "Día"}
        </h1>
        <p className="text-muted-foreground">{dateLabel}</p>
        {!isToday && (
          <Link
            href="/"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Volver a hoy
          </Link>
        )}
      </div>

      <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Comidas</CardTitle>
              <CardDescription>Consumido vs meta</CardDescription>
            </div>
            <CardAction>
              <MealFormDialog
                foods={foods}
                defaultDate={date}
                label="Registrar comida"
                icon={<Plus />}
                size="sm"
              />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <GoalProgress
              label="Calorías"
              value={t.kcal}
              goal={goals.daily_kcal}
              unit="kcal"
            />
            <GoalProgress
              label="Proteína"
              value={t.protein}
              goal={goals.daily_protein}
              unit="g"
            />
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Carbs" value={`${t.carbs} g`} />
              <Stat label="Grasa" value={`${t.fat} g`} />
            </div>
            <SectionLink href={`/meals?date=${date}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Entreno</CardTitle>
              <CardDescription>
                {dayWorkouts.length === 0
                  ? "Sin entrenos"
                  : `${dayWorkouts.length} sesión${dayWorkouts.length === 1 ? "" : "es"} · ${totalMin} min`}
              </CardDescription>
            </div>
            <CardAction>
              <WorkoutFormDialog
                defaultDate={date}
                exercises={exercises}
                label="Registrar entreno"
                icon={<Plus />}
                size="sm"
              />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {dayWorkouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no entrenaste este día.
              </p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {dayWorkouts.map((w) => (
                  <li key={w.id}>
                    {WORKOUT_TYPE_LABELS[w.type]}
                    {w.durationMin != null && ` · ${w.durationMin} min`}
                    {w.sets.length > 0 &&
                      ` · ${w.sets.length} ejercicio${w.sets.length === 1 ? "" : "s"}`}
                  </li>
                ))}
              </ul>
            )}
            <SectionLink href={`/workouts?date=${date}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Hábitos</CardTitle>
              <CardDescription>
                {doneCount}/{activeHabits.length} completados
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {activeHabits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay hábitos activos.
              </p>
            ) : (
              activeHabits.map((habit) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  date={date}
                  initialValue={valueByHabit.get(habit.id) ?? 0}
                />
              ))
            )}
            <SectionLink href={`/habits?date=${date}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Peso</CardTitle>
              <CardDescription>
                {latest
                  ? `Último registro: ${format(parseISO(latest.date), "d MMM", { locale: es })}`
                  : "Sin registros"}
              </CardDescription>
            </div>
            <CardAction>
              <MetricFormDialog
                defaultDate={date}
                label="Registrar peso"
                icon={<Plus />}
                size="sm"
              />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label="Peso"
                value={latest ? `${latest.weightKg} kg` : "—"}
              />
              <Stat
                label="Vs anterior"
                value={
                  delta != null
                    ? `${delta > 0 ? "+" : ""}${Math.round(delta * 10) / 10} kg`
                    : "—"
                }
              />
            </div>
            <SectionLink href="/metrics" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function TrendsSection({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  await connection();
  const { range: rawRange } = await searchParams;
  const range = rawRange === "7" || rawRange === "30" ? Number(rawRange) : 14;

  const today = format(new Date(), "yyyy-MM-dd");
  const startDate = format(addDays(parseISO(today), -(range - 1)), "yyyy-MM-dd");
  const workoutsStart = format(
    startOfWeekDate(addDays(parseISO(today), -7 * 7)),
    "yyyy-MM-dd",
  );
  const habitsStart = format(addDays(parseISO(today), -89), "yyyy-MM-dd");
  const rangeDays = Array.from({ length: range }, (_, i) =>
    format(addDays(parseISO(startDate), i), "yyyy-MM-dd"),
  );

  const [macroDays, metrics, rangeWorkouts, habits, habitLogs] =
    await Promise.all([
      getDayTotalsInRange(startDate, today),
      getMetricsInRange(startDate, today),
      getWorkoutsInRange(workoutsStart, today),
      listHabits(true),
      getHabitLogsInRange(habitsStart, today),
    ]);

  const totalsByDate = new Map(macroDays.map((d) => [d.date, d]));
  const macroData = rangeDays.map((date) => {
    const d = totalsByDate.get(date);
    return {
      date,
      label: format(parseISO(date), "d MMM", { locale: es }),
      kcal: Math.round(d?.kcal ?? 0),
      protein: Math.round((d?.protein ?? 0) * 10) / 10,
      carbs: Math.round((d?.carbs ?? 0) * 10) / 10,
      fat: Math.round((d?.fat ?? 0) * 10) / 10,
    };
  });
  const goals = await getGoals();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold tracking-tight">Tendencias</h2>
        <RangeNav range={range} />
      </div>
      <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
        <WeightChart data={weightSeries(metrics)} />
        <MacrosChart
          data={macroData}
          kcalGoal={goals.daily_kcal}
          proteinGoal={goals.daily_protein}
        />
        <WorkoutsChart data={weekBuckets(rangeWorkouts, today)} />
        <HabitsChart data={habitStats(habits, habitLogs, rangeDays, today)} />
      </div>
    </div>
  );
}

function startOfWeekDate(d: Date): Date {
  const day = (d.getDay() + 6) % 7;
  return addDays(d, -day);
}

function SectionLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="w-fit text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
    >
      Ver detalle
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function GoalProgress({
  label,
  value,
  goal,
  unit,
}: {
  label: string;
  value: number;
  goal?: number;
  unit: string;
}) {
  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : null;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span>
          <span className="font-mono font-semibold tabular-nums">
            {Math.round(value * 10) / 10} {unit}
          </span>
          {goal != null && (
            <span className="text-muted-foreground"> / {goal} {unit}</span>
          )}
        </span>
      </div>
      {pct != null && (
        <div className="h-2 rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}
