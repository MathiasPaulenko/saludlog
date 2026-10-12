import { format } from "date-fns";
import { es } from "date-fns/locale";
import { connection } from "next/server";
import { Suspense } from "react";
import { HabitRow } from "@/components/habits/habit-row";
import { HabitsConfig } from "@/components/habits/habits-config";
import { DateNav } from "@/components/meals/date-nav";
import { getHabitLogsForDate, listHabits } from "@/lib/queries/habits";

export default function HabitsPage({ searchParams }: PageProps<"/habits">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Hábitos</h1>
      <Suspense fallback={<p className="text-muted-foreground">Cargando…</p>}>
        <HabitsDay searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function HabitsDay({
  searchParams,
}: {
  searchParams: PageProps<"/habits">["searchParams"];
}) {
  await connection();
  const { date: raw } = await searchParams;
  const date =
    typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? raw
      : format(new Date(), "yyyy-MM-dd");

  const [activeHabits, allHabits, logs] = await Promise.all([
    listHabits(true),
    listHabits(false),
    getHabitLogsForDate(date),
  ]);
  const valueByHabit = new Map(logs.map((l) => [l.habitId, l.value]));
  const doneCount = activeHabits.filter((h) => {
    const v = valueByHabit.get(h.id) ?? 0;
    return h.unit === "check" ? v >= 1 : h.targetDaily != null ? v >= h.targetDaily : v > 0;
  }).length;

  const rawLabel = format(
    new Date(`${date}T12:00:00`),
    "EEEE d 'de' MMMM",
    { locale: es },
  );
  const dateLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <DateNav date={date} basePath="/habits" />
        <span className="ml-auto text-sm text-muted-foreground">
          {doneCount}/{activeHabits.length} completados
        </span>
      </div>

      <p className="text-sm text-muted-foreground">{dateLabel}</p>

      {activeHabits.length === 0 ? (
        <p className="text-muted-foreground">
          No hay hábitos activos. Configuralos abajo.
        </p>
      ) : (
        <div className="grid max-w-3xl gap-2 sm:grid-cols-2">
          {activeHabits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              date={date}
              initialValue={valueByHabit.get(habit.id) ?? 0}
            />
          ))}
        </div>
      )}

      <HabitsConfig habits={allHabits} />
    </>
  );
}
