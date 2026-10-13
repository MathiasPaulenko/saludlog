import { addDays, format, parseISO, startOfWeek } from "date-fns";
import type { Habit, HabitLog } from "@/db/schema";
import { dateFnsLocale, type Locale } from "@/lib/i18n";

export interface WeightPoint {
  label: string;
  weight: number;
  avg: number | null;
}

export function weightSeries(
  metrics: { date: string; weightKg: number }[],
  locale: Locale,
): WeightPoint[] {
  return metrics.map((m, i) => {
    const window = metrics.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((s, x) => s + x.weightKg, 0) / window.length;
    return {
      label: format(parseISO(m.date), "d MMM", { locale: dateFnsLocale(locale) }),
      weight: m.weightKg,
      avg: window.length > 1 ? Math.round(avg * 10) / 10 : null,
    };
  });
}

export interface WeekBucket {
  label: string;
  sessions: number;
  minutes: number;
}

export function weekBuckets(
  workouts: { date: string; durationMin: number | null }[],
  endDate: string,
  locale: Locale,
  weeks = 8,
): WeekBucket[] {
  const end = startOfWeek(parseISO(endDate), { weekStartsOn: 1 });
  const buckets: WeekBucket[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = addDays(end, -7 * w);
    const weekEnd = addDays(weekStart, 7);
    const inWeek = workouts.filter((x) => {
      const d = parseISO(x.date);
      return d >= weekStart && d < weekEnd;
    });
    buckets.push({
      label: format(weekStart, "d MMM", { locale: dateFnsLocale(locale) }),
      sessions: inWeek.length,
      minutes: inWeek.reduce((s, x) => s + (x.durationMin ?? 0), 0),
    });
  }
  return buckets;
}

export interface HabitStat {
  id: number;
  name: string;
  pct: number;
  streak: number;
}

const habitDone = (h: Habit, v: number) =>
  h.unit === "check" ? v >= 1 : h.targetDaily != null ? v >= h.targetDaily : v > 0;

export function habitStats(
  habits: Habit[],
  logs: HabitLog[],
  rangeDays: string[],
  endDate: string,
): HabitStat[] {
  return habits.map((habit) => {
    const byDate = new Map(
      logs.filter((l) => l.habitId === habit.id).map((l) => [l.date, l.value]),
    );

    const inRange = rangeDays.filter((d) => habitDone(habit, byDate.get(d) ?? 0));
    const pct = Math.round((inRange.length / rangeDays.length) * 100);

    // Racha hacia atrás desde endDate; días sin log cortan la racha.
    // Hoy sin log todavía no rompe: la racha se mide hasta ayer si hoy está vacío.
    let streak = 0;
    let cursor = parseISO(endDate);
    if (!habitDone(habit, byDate.get(format(cursor, "yyyy-MM-dd")) ?? 0)) {
      cursor = addDays(cursor, -1);
    }
    while (habitDone(habit, byDate.get(format(cursor, "yyyy-MM-dd")) ?? 0)) {
      streak++;
      cursor = addDays(cursor, -1);
    }

    return { id: habit.id, name: habit.name, pct, streak };
  });
}
