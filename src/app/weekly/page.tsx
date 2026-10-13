import { addDays, endOfWeek, format, parseISO, startOfWeek } from "date-fns";
import { connection } from "next/server";
import { Suspense } from "react";
import { WeekNav } from "@/components/workouts/week-nav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getHabitLogsInRange, listHabits } from "@/lib/queries/habits";
import { getDayTotalsInRange } from "@/lib/queries/meals";
import { getMetricsInRange } from "@/lib/queries/metrics";
import { getWorkoutsInRange } from "@/lib/queries/workouts";
import type { Habit } from "@/db/schema";
import { dateFnsLocale, getLocale, t } from "@/lib/i18n";

const WEEK_OPTS = { weekStartsOn: 1 as const };

const S = {
  es: {
    title: "Semana",
    kcalAvg: "kcal promedio/día",
    workouts: "Entrenos",
    weightDelta: "Delta peso",
    habitsDone: "Hábitos cumplidos",
    metric: "Métrica",
    thisWeek: "Esta semana",
    previous: "Anterior",
    min: "min",
  },
  en: {
    title: "Week",
    kcalAvg: "avg kcal/day",
    workouts: "Workouts",
    weightDelta: "Weight delta",
    habitsDone: "Habits completed",
    metric: "Metric",
    thisWeek: "This week",
    previous: "Previous",
    min: "min",
  },
};

export default function WeeklyPage({ searchParams }: PageProps<"/weekly">) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <WeeklyReport searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

interface WeekSummary {
  kcalAvg: number | null;
  kcalDays: number;
  sessions: number;
  minutes: number;
  weightDelta: number | null;
  habitPct: number | null;
}

function habitDone(h: Habit, v: number) {
  return h.unit === "check"
    ? v >= 1
    : h.targetDaily != null
      ? v >= h.targetDaily
      : v > 0;
}

async function WeeklyReport({
  searchParams,
}: {
  searchParams: PageProps<"/weekly">["searchParams"];
}) {
  await connection();
  const [{ date: raw }, locale] = await Promise.all([
    searchParams,
    getLocale(),
  ]);
  const s = t(S, locale);
  const loc = dateFnsLocale(locale);
  const date =
    typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? raw
      : format(new Date(), "yyyy-MM-dd");

  const current = parseISO(date);
  const weekStart = startOfWeek(current, WEEK_OPTS);
  const weekEnd = endOfWeek(current, WEEK_OPTS);
  const prevStart = addDays(weekStart, -7);
  const prevEnd = addDays(weekEnd, -7);
  const today = format(new Date(), "yyyy-MM-dd");

  const ws = format(weekStart, "yyyy-MM-dd");
  const we = format(weekEnd, "yyyy-MM-dd");
  const ps = format(prevStart, "yyyy-MM-dd");
  const pe = format(prevEnd, "yyyy-MM-dd");
  // La semana en curso solo cuenta hasta hoy.
  const effectiveEnd = we > today ? today : we;

  const [macros, workouts, metrics, habitLogs, habits] = await Promise.all([
    getDayTotalsInRange(ps, we),
    getWorkoutsInRange(ps, we),
    getMetricsInRange(format(addDays(prevStart, -7), "yyyy-MM-dd"), we),
    getHabitLogsInRange(ps, we),
    listHabits(true),
  ]);

  const summarize = (s: string, e: string): WeekSummary => {
    const days = macros.filter((m) => m.date >= s && m.date <= e);
    const wk = workouts.filter((w) => w.date >= s && w.date <= e);

    const weights = metrics.filter((m) => m.date >= s && m.date <= e);
    const weightDelta =
      weights.length >= 2
        ? Math.round((weights.at(-1)!.weightKg - weights[0].weightKg) * 10) / 10
        : null;

    const weekDays = Math.max(
      1,
      Math.round(
        (parseISO(e).getTime() - parseISO(s).getTime()) / 86400000,
      ) + 1,
    );
    const slots = habits.length * weekDays;
    const done = habitLogs.filter(
      (l) =>
        l.date >= s &&
        l.date <= e &&
        habits.some((h) => h.id === l.habitId && habitDone(h, l.value)),
    ).length;

    return {
      kcalAvg:
        days.length > 0
          ? Math.round(days.reduce((a, d) => a + d.kcal, 0) / days.length)
          : null,
      kcalDays: days.length,
      sessions: wk.length,
      minutes: wk.reduce((a, w) => a + (w.durationMin ?? 0), 0),
      weightDelta,
      habitPct: slots > 0 ? Math.round((done / slots) * 100) : null,
    };
  };

  const cur = summarize(ws, effectiveEnd);
  const prev = summarize(ps, pe);

  const label = `${format(weekStart, "d MMM", { locale: loc })} – ${format(weekEnd, "d MMM", { locale: loc })}`;

  const rows: { label: string; cur: string; prev: string }[] = [
    {
      label: s.kcalAvg,
      cur: cur.kcalAvg != null ? `${cur.kcalAvg} (${cur.kcalDays}d)` : "—",
      prev: prev.kcalAvg != null ? `${prev.kcalAvg} (${prev.kcalDays}d)` : "—",
    },
    {
      label: s.workouts,
      cur: `${cur.sessions} · ${cur.minutes} ${s.min}`,
      prev: `${prev.sessions} · ${prev.minutes} ${s.min}`,
    },
    {
      label: s.weightDelta,
      cur:
        cur.weightDelta != null
          ? `${cur.weightDelta > 0 ? "+" : ""}${cur.weightDelta} kg`
          : "—",
      prev:
        prev.weightDelta != null
          ? `${prev.weightDelta > 0 ? "+" : ""}${prev.weightDelta} kg`
          : "—",
    },
    {
      label: s.habitsDone,
      cur: cur.habitPct != null ? `${cur.habitPct}%` : "—",
      prev: prev.habitPct != null ? `${prev.habitPct}%` : "—",
    },
  ];

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
      <WeekNav date={date} basePath="/weekly" />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base capitalize">{label}</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 font-medium">{s.metric}</th>
                <th className="pb-2 text-right font-medium">{s.thisWeek}</th>
                <th className="pb-2 text-right font-medium">{s.previous}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-border">
                  <td className="py-2 text-muted-foreground">{r.label}</td>
                  <td className="py-2 text-right font-medium">{r.cur}</td>
                  <td className="py-2 text-right text-muted-foreground">
                    {r.prev}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
