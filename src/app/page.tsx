import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
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
import { WORKOUT_TYPE_LABELS } from "@/lib/labels";
import { roundMacros } from "@/lib/macros";
import { listFoods } from "@/lib/queries/foods";
import { getHabitLogsForDate, listHabits } from "@/lib/queries/habits";
import { getDayTotals } from "@/lib/queries/meals";
import { getLatestMetric } from "@/lib/queries/metrics";
import { getWorkoutsForDate } from "@/lib/queries/workouts";

export default function TodayPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Hoy</h1>
      <div className="grid max-w-5xl gap-4 lg:grid-cols-2">
        <Suspense fallback={null}>
          <MealsCard />
        </Suspense>
        <Suspense fallback={null}>
          <WorkoutsCard />
        </Suspense>
        <Suspense fallback={null}>
          <HabitsCard />
        </Suspense>
        <Suspense fallback={null}>
          <MetricsCard />
        </Suspense>
      </div>
    </div>
  );
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
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

async function MealsCard() {
  await connection();
  const today = format(new Date(), "yyyy-MM-dd");
  const [totals, foods] = await Promise.all([
    getDayTotals(today),
    listFoods(),
  ]);
  const t = roundMacros(totals);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Comidas</CardTitle>
          <CardDescription>Totales del día</CardDescription>
        </div>
        <CardAction>
          <MealFormDialog
            foods={foods}
            defaultDate={today}
            label="Registrar comida"
            icon={<Plus />}
            size="sm"
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Calorías" value={`${t.kcal} kcal`} />
          <Stat label="Proteína" value={`${t.protein} g`} />
          <Stat label="Carbs" value={`${t.carbs} g`} />
          <Stat label="Grasa" value={`${t.fat} g`} />
        </div>
        <SectionLink href="/meals" />
      </CardContent>
    </Card>
  );
}

async function WorkoutsCard() {
  await connection();
  const today = format(new Date(), "yyyy-MM-dd");
  const todayWorkouts = await getWorkoutsForDate(today);
  const totalMin = todayWorkouts.reduce(
    (sum, w) => sum + (w.durationMin ?? 0),
    0,
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Entreno</CardTitle>
          <CardDescription>
            {todayWorkouts.length === 0
              ? "Sin entrenos hoy"
              : `${todayWorkouts.length} sesión${todayWorkouts.length === 1 ? "" : "es"}`}
          </CardDescription>
        </div>
        <CardAction>
          <WorkoutFormDialog
            defaultDate={today}
            label="Registrar entreno"
            icon={<Plus />}
            size="sm"
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Sesiones" value={String(todayWorkouts.length)} />
          <Stat label="Duración" value={`${totalMin} min`} />
        </div>
        {todayWorkouts.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {todayWorkouts.map((w) => WORKOUT_TYPE_LABELS[w.type]).join(" · ")}
          </p>
        )}
        <SectionLink href="/workouts" />
      </CardContent>
    </Card>
  );
}

async function HabitsCard() {
  await connection();
  const today = format(new Date(), "yyyy-MM-dd");
  const [activeHabits, logs] = await Promise.all([
    listHabits(true),
    getHabitLogsForDate(today),
  ]);
  const valueByHabit = new Map(logs.map((l) => [l.habitId, l.value]));
  const doneCount = activeHabits.filter((h) => {
    const v = valueByHabit.get(h.id) ?? 0;
    return h.unit === "check"
      ? v >= 1
      : h.targetDaily != null
        ? v >= h.targetDaily
        : v > 0;
  }).length;

  return (
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
              date={today}
              initialValue={valueByHabit.get(habit.id) ?? 0}
            />
          ))
        )}
        <SectionLink href="/habits" />
      </CardContent>
    </Card>
  );
}

async function MetricsCard() {
  await connection();
  const today = format(new Date(), "yyyy-MM-dd");
  const latest = await getLatestMetric();

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Peso</CardTitle>
          <CardDescription>
            {latest
              ? `Último registro: ${format(new Date(`${latest.date}T12:00:00`), "d MMM", { locale: es })}`
              : "Sin registros"}
          </CardDescription>
        </div>
        <CardAction>
          <MetricFormDialog
            defaultDate={today}
            label="Registrar peso"
            icon={<Plus />}
            size="sm"
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Peso"
            value={latest ? `${latest.weightKg} kg` : "—"}
          />
          <Stat
            label="% Grasa"
            value={latest?.bodyFatPct != null ? `${latest.bodyFatPct}%` : "—"}
          />
          <Stat
            label="Cintura"
            value={latest?.waistCm != null ? `${latest.waistCm} cm` : "—"}
          />
        </div>
        <SectionLink href="/metrics" />
      </CardContent>
    </Card>
  );
}
