import { X } from "lucide-react";
import { Suspense } from "react";
import { deletePlanItem } from "@/actions/plan";
import { PlanItemDialog } from "@/components/plan/plan-item-dialog";
import { BASE_UNIT_LABELS, MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/labels";
import { getWeeklyPlan, type DayPlan } from "@/lib/queries/plan";
import { listFoods } from "@/lib/queries/foods";
import { cn } from "cn";

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export default function PlanPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dieta</h1>
        <p className="text-sm text-muted-foreground">
          Tu plan semanal — distinto a lo que registrás cada día en Comidas.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Cargando…</p>}>
        <WeeklyGrid />
      </Suspense>
    </div>
  );
}

async function WeeklyGrid() {
  const [plan, foods] = await Promise.all([getWeeklyPlan(), listFoods()]);
  const today = (new Date().getDay() + 6) % 7; // 0 = lunes

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[72rem] grid-cols-7 gap-3">
        {DAYS.map((day, d) => (
          <div key={day} className="flex flex-col gap-3">
            <h2
              className={cn(
                "text-sm font-medium text-muted-foreground",
                d === today && "font-semibold text-primary",
              )}
            >
              {day}
            </h2>
            {MEAL_TYPES.map((t) => (
              <MealSlot
                key={t}
                day={d}
                type={t}
                items={plan[d][t]}
                foods={foods}
              />
            ))}
            <DayTotals items={plan[d]} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MealSlot({
  day,
  type,
  items,
  foods,
}: {
  day: number;
  type: (typeof MEAL_TYPES)[number];
  items: DayPlan[typeof type];
  foods: Awaited<ReturnType<typeof listFoods>>;
}) {
  return (
    <section className="flex min-h-24 flex-col gap-1 rounded-lg border border-border p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {MEAL_TYPE_LABELS[type]}
        </span>
        <PlanItemDialog dayOfWeek={day} mealType={type} foods={foods} />
      </div>
      <ul className="flex flex-col">
        {items.map((it) => (
          <li
            key={it.id}
            className="group flex items-baseline gap-1.5 rounded px-1 py-0.5 text-sm hover:bg-accent"
          >
            <span className="min-w-0 flex-1 truncate">{it.foodName}</span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {it.amount}
              {BASE_UNIT_LABELS[it.baseUnit]}
            </span>
            <form action={deletePlanItem.bind(null, it.id)}>
              <button
                type="submit"
                aria-label={`Quitar ${it.foodName}`}
                className="hidden shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive group-hover:block"
              >
                <X className="size-3.5" />
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

function DayTotals({ items }: { items: DayPlan }) {
  const totals = MEAL_TYPES.reduce(
    (acc, t) => {
      for (const it of items[t]) {
        acc.kcal += it.macros.kcal;
        acc.protein += it.macros.protein;
        acc.carbs += it.macros.carbs;
        acc.fat += it.macros.fat;
      }
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return (
    <div className="rounded-lg border border-dashed border-border p-2 font-mono text-xs tabular-nums">
      <p className="font-semibold text-foreground">
        {Math.round(totals.kcal)} kcal
      </p>
      <p className="text-muted-foreground">
        P {Math.round(totals.protein)} · C {Math.round(totals.carbs)} · G{" "}
        {Math.round(totals.fat)}
      </p>
    </div>
  );
}
