"use client";

import { useState } from "react";
import type { TooltipContentProps } from "recharts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HabitStat, WeekBucket, WeightPoint } from "@/lib/chart-data";
import type { Macros } from "@/lib/macros";
import { useT } from "@/lib/use-locale";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const axisStyle = { fontSize: 11, fill: "var(--muted-foreground)" };
const gridStroke = "var(--border)";

const S = {
  es: {
    weight: "Peso",
    weightDesc: "Con media móvil de 7 mediciones",
    weightEmpty: "Loggeá tu peso para ver la tendencia.",
    weightAvg: "Media 7d",
    nutrition: "Nutrición diaria",
    calories: "Calorías",
    protein: "Proteína",
    perDay: "por día",
    mealsEmpty: "Sin comidas registradas en el período.",
    workoutsTitle: "Entrenos por semana",
    workoutsDesc: "Sesiones y minutos (últimas 8 semanas)",
    workoutsEmpty: "Sin entrenos en las últimas semanas.",
    sessions: "Sesiones",
    minutes: "Minutos",
    habitsTitle: "Hábitos",
    habitsDesc: "% de días cumplidos en el período + racha actual",
    habitsEmpty: "No hay hábitos activos.",
    adherence: "Cumplimiento",
    streak: "racha",
    goal: "meta",
  },
  en: {
    weight: "Weight",
    weightDesc: "With 7-measurement moving average",
    weightEmpty: "Log your weight to see the trend.",
    weightAvg: "7d avg",
    nutrition: "Daily nutrition",
    calories: "Calories",
    protein: "Protein",
    perDay: "per day",
    mealsEmpty: "No meals logged in this period.",
    workoutsTitle: "Workouts per week",
    workoutsDesc: "Sessions and minutes (last 8 weeks)",
    workoutsEmpty: "No workouts in the last weeks.",
    sessions: "Sessions",
    minutes: "Minutes",
    habitsTitle: "Habits",
    habitsDesc: "% of days completed in period + current streak",
    habitsEmpty: "No active habits.",
    adherence: "Adherence",
    streak: "streak",
    goal: "goal",
  },
};

function ChartTip({
  active,
  payload,
  label,
}: Partial<TooltipContentProps<number, string>>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="text-muted-foreground">
          {p.name}: <span className="text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <p className="flex h-44 items-center justify-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}

export function WeightChart({ data }: { data: WeightPoint[] }) {
  const s = useT(S);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{s.weight}</CardTitle>
        <CardDescription>{s.weightDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState>{s.weightEmpty}</EmptyState>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} />
              <YAxis tick={axisStyle} tickLine={false} domain={["auto", "auto"]} />
              <Tooltip content={<ChartTip />} />
              <Line
                dataKey="weight"
                name={s.weight}
                type="monotone"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                dataKey="avg"
                name={s.weightAvg}
                type="monotone"
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function MacrosChart({
  data,
  kcalGoal,
  proteinGoal,
}: {
  data: (Macros & { date: string; label: string })[];
  kcalGoal?: number;
  proteinGoal?: number;
}) {
  const s = useT(S);
  const [metric, setMetric] = useState<"kcal" | "protein">("kcal");
  const goal = metric === "kcal" ? kcalGoal : proteinGoal;
  const unit = metric === "kcal" ? "kcal" : "g";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{s.nutrition}</CardTitle>
        <CardDescription className="flex items-center gap-2">
          {metric === "kcal" ? s.calories : s.protein} {s.perDay}
          <span className="ml-auto flex gap-1">
            <Button
              variant={metric === "kcal" ? "default" : "outline"}
              size="xs"
              onClick={() => setMetric("kcal")}
            >
              kcal
            </Button>
            <Button
              variant={metric === "protein" ? "default" : "outline"}
              size="xs"
              onClick={() => setMetric("protein")}
            >
              {s.protein}
            </Button>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState>{s.mealsEmpty}</EmptyState>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} />
              <YAxis tick={axisStyle} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              {goal != null && (
                <ReferenceLine
                  y={goal}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  label={{
                    value: `${s.goal} ${goal}`,
                    position: "insideTopRight",
                    fontSize: 10,
                    fill: "var(--muted-foreground)",
                  }}
                />
              )}
              <Bar
                dataKey={metric}
                name={metric === "kcal" ? "kcal" : `${s.protein.toLowerCase()} (${unit})`}
                fill="var(--primary)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function WorkoutsChart({ data }: { data: WeekBucket[] }) {
  const s = useT(S);
  const hasData = data.some((w) => w.sessions > 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{s.workoutsTitle}</CardTitle>
        <CardDescription>{s.workoutsDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <EmptyState>{s.workoutsEmpty}</EmptyState>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={gridStroke} vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} />
              <YAxis
                yAxisId="left"
                tick={axisStyle}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={axisStyle}
                tickLine={false}
              />
              <Tooltip content={<ChartTip />} />
              <Bar
                yAxisId="left"
                dataKey="sessions"
                name={s.sessions}
                fill="var(--primary)"
                radius={[3, 3, 0, 0]}
              />
              <Line
                yAxisId="right"
                dataKey="minutes"
                name={s.minutes}
                type="monotone"
                stroke="var(--muted-foreground)"
                strokeWidth={1.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function HabitsChart({ data }: { data: HabitStat[] }) {
  const s = useT(S);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{s.habitsTitle}</CardTitle>
        <CardDescription>{s.habitsDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <EmptyState>{s.habitsEmpty}</EmptyState>
        ) : (
          <div className="flex flex-col gap-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
              >
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={axisStyle}
                  tickLine={false}
                  width={110}
                />
                <Tooltip content={<ChartTip />} />
                <Bar
                  dataKey="pct"
                  name={s.adherence}
                  fill="var(--primary)"
                  radius={[0, 3, 3, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {data.map((h) => (
                <li key={h.id}>
                  {h.name}: <span className="text-foreground">{h.pct}%</span>
                  {h.streak > 0 && (
                    <span className="text-foreground">
                      {" "}
                      · {s.streak} {h.streak}d
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
