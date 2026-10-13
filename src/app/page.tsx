import { addDays, format, parseISO } from "date-fns";
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
import { dateFnsLocale, getLocale, t } from "@/lib/i18n";
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

const S = {
  es: {
    loading: "Cargando…",
    today: "Hoy",
    day: "Día",
    backToToday: "Volver a hoy",
    meals: "Comidas",
    mealsDesc: "Consumido vs meta",
    logMeal: "Registrar comida",
    calories: "Calorías",
    protein: "Proteína",
    fat: "Grasa",
    workout: "Entreno",
    noWorkouts: "Sin entrenos",
    session: "sesión",
    sessions: "sesiones",
    min: "min",
    logWorkout: "Registrar entreno",
    notTrainedYet: "Todavía no entrenaste este día.",
    exercise: "ejercicio",
    exercises: "ejercicios",
    habits: "Hábitos",
    done: "completados",
    noHabits: "No hay hábitos activos.",
    weight: "Peso",
    lastRecord: "Último registro",
    noRecords: "Sin registros",
    logWeight: "Registrar peso",
    vsPrev: "Vs anterior",
    trends: "Tendencias",
    seeDetail: "Ver detalle",
  },
  en: {
    loading: "Loading…",
    today: "Today",
    day: "Day",
    backToToday: "Back to today",
    meals: "Meals",
    mealsDesc: "Consumed vs goal",
    logMeal: "Log meal",
    calories: "Calories",
    protein: "Protein",
    fat: "Fat",
    workout: "Workout",
    noWorkouts: "No workouts",
    session: "session",
    sessions: "sessions",
    min: "min",
    logWorkout: "Log workout",
    notTrainedYet: "You haven't trained this day.",
    exercise: "exercise",
    exercises: "exercises",
    habits: "Habits",
    done: "done",
    noHabits: "No active habits.",
    weight: "Weight",
    lastRecord: "Last entry",
    noRecords: "No records",
    logWeight: "Log weight",
    vsPrev: "Vs previous",
    trends: "Trends",
    seeDetail: "See detail",
  },
};

export default function TodayPage({ searchParams }: PageProps<"/">) {
  return (
    <div className="flex flex-col gap-8">
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
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
  const [{ date: raw }, locale] = await Promise.all([searchParams, getLocale()]);
  const s = t(S, locale);
  const loc = dateFnsLocale(locale);
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

  const tm = roundMacros(totals);
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

  const rawLabel = format(
    parseISO(date),
    locale === "en" ? "EEEE, MMMM d" : "EEEE d 'de' MMMM",
    { locale: loc },
  );
  const dateLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isToday ? s.today : s.day}
        </h1>
        <p className="text-muted-foreground">{dateLabel}</p>
        {!isToday && (
          <Link
            href="/"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {s.backToToday}
          </Link>
        )}
      </div>

      <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{s.meals}</CardTitle>
              <CardDescription>{s.mealsDesc}</CardDescription>
            </div>
            <CardAction>
              <MealFormDialog
                foods={foods}
                defaultDate={date}
                label={s.logMeal}
                icon={<Plus />}
                size="sm"
              />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <GoalProgress
              label={s.calories}
              value={tm.kcal}
              goal={goals.daily_kcal}
              unit="kcal"
            />
            <GoalProgress
              label={s.protein}
              value={tm.protein}
              goal={goals.daily_protein}
              unit="g"
            />
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Carbs" value={`${tm.carbs} g`} />
              <Stat label={s.fat} value={`${tm.fat} g`} />
            </div>
            <SectionLink href={`/meals?date=${date}`} label={s.seeDetail} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{s.workout}</CardTitle>
              <CardDescription>
                {dayWorkouts.length === 0
                  ? s.noWorkouts
                  : `${dayWorkouts.length} ${dayWorkouts.length === 1 ? s.session : s.sessions} · ${totalMin} ${s.min}`}
              </CardDescription>
            </div>
            <CardAction>
              <WorkoutFormDialog
                defaultDate={date}
                exercises={exercises}
                label={s.logWorkout}
                icon={<Plus />}
                size="sm"
              />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {dayWorkouts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {s.notTrainedYet}
              </p>
            ) : (
              <ul className="flex flex-col gap-1 text-sm">
                {dayWorkouts.map((w) => (
                  <li key={w.id}>
                    {WORKOUT_TYPE_LABELS[locale][w.type]}
                    {w.durationMin != null && ` · ${w.durationMin} ${s.min}`}
                    {w.sets.length > 0 &&
                      ` · ${w.sets.length} ${w.sets.length === 1 ? s.exercise : s.exercises}`}
                  </li>
                ))}
              </ul>
            )}
            <SectionLink href={`/workouts?date=${date}`} label={s.seeDetail} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{s.habits}</CardTitle>
              <CardDescription>
                {doneCount}/{activeHabits.length} {s.done}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {activeHabits.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {s.noHabits}
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
            <SectionLink href={`/habits?date=${date}`} label={s.seeDetail} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>{s.weight}</CardTitle>
              <CardDescription>
                {latest
                  ? `${s.lastRecord}: ${format(parseISO(latest.date), "d MMM", { locale: loc })}`
                  : s.noRecords}
              </CardDescription>
            </div>
            <CardAction>
              <MetricFormDialog
                defaultDate={date}
                label={s.logWeight}
                icon={<Plus />}
                size="sm"
              />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat
                label={s.weight}
                value={latest ? `${latest.weightKg} kg` : "—"}
              />
              <Stat
                label={s.vsPrev}
                value={
                  delta != null
                    ? `${delta > 0 ? "+" : ""}${Math.round(delta * 10) / 10} kg`
                    : "—"
                }
              />
            </div>
            <SectionLink href="/metrics" label={s.seeDetail} />
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
  const [{ range: rawRange }, locale] = await Promise.all([
    searchParams,
    getLocale(),
  ]);
  const s = t(S, locale);
  const loc = dateFnsLocale(locale);
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
      label: format(parseISO(date), "d MMM", { locale: loc }),
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
        <h2 className="text-xl font-semibold tracking-tight">{s.trends}</h2>
        <RangeNav range={range} />
      </div>
      <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
        <WeightChart data={weightSeries(metrics, locale)} />
        <MacrosChart
          data={macroData}
          kcalGoal={goals.daily_kcal}
          proteinGoal={goals.daily_protein}
        />
        <WorkoutsChart data={weekBuckets(rangeWorkouts, today, locale)} />
        <HabitsChart data={habitStats(habits, habitLogs, rangeDays, today)} />
      </div>
    </div>
  );
}

function startOfWeekDate(d: Date): Date {
  const day = (d.getDay() + 6) % 7;
  return addDays(d, -day);
}

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="w-fit text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
    >
      {label}
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
