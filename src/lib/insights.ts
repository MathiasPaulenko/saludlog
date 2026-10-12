import type { Habit, HabitLog } from "@/db/schema";
import { habitStats } from "@/lib/chart-data";
import type { Macros } from "@/lib/macros";

export interface Insight {
  key: string;
  title: string;
  rule: string;
  verdict: string;
  detail: string;
}

const fmt1 = (n: number) => Math.round(n * 10) / 10;
const avg = (xs: number[]) =>
  xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;

/**
 * Regla: compara el promedio de kcal de los días con sueño <6h
 * contra los días con sueño ≥7h. Días intermedios no cuentan.
 */
export function sleepKcalInsight(
  sleepLogs: HabitLog[],
  dayTotals: (Macros & { date: string })[],
): Insight | null {
  const kcalByDate = new Map(dayTotals.map((d) => [d.date, d.kcal]));
  const low: number[] = [];
  const high: number[] = [];
  for (const l of sleepLogs) {
    const kcal = kcalByDate.get(l.date);
    if (kcal == null) continue;
    if (l.value < 6) low.push(kcal);
    else if (l.value >= 7) high.push(kcal);
  }
  if (low.length < 3 || high.length < 3) return null;

  const a = Math.round(avg(low));
  const b = Math.round(avg(high));
  const diff = a - b;
  const verdict =
    Math.abs(diff) < 50
      ? "El sueño no muestra relación clara con lo que comés."
      : diff > 0
        ? `Los días con poco sueño comés ~${Math.abs(diff)} kcal más.`
        : `Los días con poco sueño comés ~${Math.abs(diff)} kcal menos.`;
  return {
    key: "sleep-kcal",
    title: "Sueño y calorías",
    rule: "kcal promedio en días con sueño <6h vs ≥7h",
    verdict,
    detail: `<6h: ${a} kcal/día (${low.length} días) · ≥7h: ${b} kcal/día (${high.length} días)`,
  };
}

/**
 * Regla: agrupa por semana las sesiones de entreno y el peso medio,
 * y compara el delta de peso medio en semanas con ≥3 sesiones vs <3.
 */
export function workoutsWeightInsight(
  workouts: { date: string }[],
  metrics: { date: string; weightKg: number }[],
  endDate: string,
): Insight | null {
  const monday = (d: string) => {
    const dt = new Date(`${d}T12:00:00`);
    dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
    return dt.toISOString().slice(0, 10);
  };

  const sessionsByWeek = new Map<string, number>();
  for (const w of workouts) {
    const k = monday(w.date);
    sessionsByWeek.set(k, (sessionsByWeek.get(k) ?? 0) + 1);
  }
  const weightByWeek = new Map<string, number[]>();
  for (const m of metrics) {
    const k = monday(m.date);
    weightByWeek.set(k, [...(weightByWeek.get(k) ?? []), m.weightKg]);
  }

  // Delta de cada semana = peso medio propio - peso medio de la semana anterior.
  const deltas: { sessions: number; delta: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const dt = new Date(`${endDate}T12:00:00`);
    dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7) - 7 * w);
    const thisWeek = dt.toISOString().slice(0, 10);
    dt.setDate(dt.getDate() - 7);
    const prevWeek = dt.toISOString().slice(0, 10);
    const cur = weightByWeek.get(thisWeek);
    const prev = weightByWeek.get(prevWeek);
    if (!cur?.length || !prev?.length) continue;
    deltas.push({
      sessions: sessionsByWeek.get(thisWeek) ?? 0,
      delta: fmt1(avg(cur) - avg(prev)),
    });
  }
  if (deltas.length < 3) return null;

  const active = deltas.filter((d) => d.sessions >= 3);
  const quiet = deltas.filter((d) => d.sessions < 3);
  if (active.length < 2 || quiet.length < 2) return null;

  const a = fmt1(avg(active.map((d) => d.delta)));
  const q = fmt1(avg(quiet.map((d) => d.delta)));
  const verdict =
    a < q
      ? `Las semanas con más entrenos tu peso baja en promedio ${Math.abs(a - q)} kg más.`
      : "Los entrenos semanales no muestran relación clara con el peso.";
  return {
    key: "workouts-weight",
    title: "Entrenos y peso",
    rule: "delta de peso medio semanal en semanas con ≥3 vs <3 sesiones",
    verdict,
    detail: `≥3 sesiones: ${a > 0 ? "+" : ""}${a} kg/sem (${active.length} sem) · <3: ${q > 0 ? "+" : ""}${q} kg/sem (${quiet.length} sem)`,
  };
}

/**
 * Regla: adherencia general en 30 días vs la del hábito
 * con mejor racha actual.
 */
export function habitConsistencyInsight(
  habits: Habit[],
  logs: HabitLog[],
  rangeDays: string[],
  endDate: string,
): Insight | null {
  const stats = habitStats(habits, logs, rangeDays, endDate);
  if (stats.length === 0) return null;
  const overall = Math.round(avg(stats.map((h) => h.pct)));
  const best = [...stats].sort((a, b) => b.streak - a.streak || b.pct - a.pct)[0];
  return {
    key: "habit-consistency",
    title: "Consistencia de hábitos",
    rule: "adherencia media de 30 días vs tu hábito más consistente",
    verdict:
      best.streak >= 7
        ? `Tu punto fuerte es ${best.name}: ${best.streak} días seguidos.`
        : `${best.name} es tu hábito más consistente (${best.pct}%).`,
    detail: `Media general: ${overall}% · ${best.name}: ${best.pct}% (racha ${best.streak}d)`,
  };
}
