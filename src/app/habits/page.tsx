import { format } from "date-fns";
import { connection } from "next/server";
import { Suspense } from "react";
import { HabitRow } from "@/components/habits/habit-row";
import { HabitsConfig } from "@/components/habits/habits-config";
import { DateNav } from "@/components/meals/date-nav";
import { dateFnsLocale, getLocale, t } from "@/lib/i18n";
import { getHabitLogsForDate, listHabits } from "@/lib/queries/habits";

const S = {
  es: {
    title: "Hábitos",
    done: "completados",
    noHabits: "No hay hábitos activos. Configuralos abajo.",
  },
  en: {
    title: "Habits",
    done: "done",
    noHabits: "No active habits. Configure them below.",
  },
};

export default function HabitsPage({ searchParams }: PageProps<"/habits">) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
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
  const [{ date: raw }, locale] = await Promise.all([
    searchParams,
    getLocale(),
  ]);
  const s = t(S, locale);
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
    locale === "en" ? "EEEE, MMMM d" : "EEEE d 'de' MMMM",
    { locale: dateFnsLocale(locale) },
  );
  const dateLabel = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
      <div className="flex flex-wrap items-center gap-3">
        <DateNav date={date} basePath="/habits" />
        <span className="ml-auto text-sm text-muted-foreground">
          {doneCount}/{activeHabits.length} {s.done}
        </span>
      </div>

      <p className="text-sm text-muted-foreground">{dateLabel}</p>

      {activeHabits.length === 0 ? (
        <p className="text-muted-foreground">{s.noHabits}</p>
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
