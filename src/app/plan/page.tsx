import { Utensils, X } from "lucide-react";
import { Suspense } from "react";
import { logPlannedMeal } from "@/actions/meals";
import { deletePlanItem } from "@/actions/plan";
import { PlanItemDialog } from "@/components/plan/plan-item-dialog";
import { getLocale, t, type Locale } from "@/lib/i18n";
import {
  BASE_UNIT_LABELS,
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
  WEEKDAY_LABELS,
} from "@/lib/labels";
import { getWeeklyPlan, type DayPlan } from "@/lib/queries/plan";
import { listFoods } from "@/lib/queries/foods";
import { cn } from "cn";

const S = {
  es: {
    title: "Dieta",
    subtitle: "Tu plan semanal — distinto a lo que registrás cada día en Comidas.",
    remove: (food: string) => `Quitar ${food}`,
    logToday: "Anotar esta comida en hoy",
  },
  en: {
    title: "Diet",
    subtitle: "Your weekly plan — separate from what you log each day in Meals.",
    remove: (food: string) => `Remove ${food}`,
    logToday: "Log this meal for today",
  },
};

export default function PlanPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <WeeklyGrid />
      </Suspense>
    </div>
  );
}

async function WeeklyGrid() {
  const [plan, foods, locale] = await Promise.all([
    getWeeklyPlan(),
    listFoods(),
    getLocale(),
  ]);
  const s = t(S, locale);
  const today = (new Date().getDay() + 6) % 7; // 0 = lunes

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
        <p className="text-sm text-muted-foreground">{s.subtitle}</p>
      </div>
      <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[72rem] grid-cols-7 gap-3">
        {WEEKDAY_LABELS[locale].map((day, d) => (
          <div key={day} className="flex flex-col gap-3">
            <h2
              className={cn(
                "text-sm font-medium text-muted-foreground",
                d === today && "font-semibold text-primary",
              )}
            >
              {day}
            </h2>
            {MEAL_TYPES.map((mt) => (
              <MealSlot
                key={mt}
                day={d}
                type={mt}
                items={plan[d][mt]}
                foods={foods}
                locale={locale}
              />
            ))}
            <DayTotals items={plan[d]} />
          </div>
        ))}
      </div>
      </div>
    </>
  );
}

function MealSlot({
  day,
  type,
  items,
  foods,
  locale,
}: {
  day: number;
  type: (typeof MEAL_TYPES)[number];
  items: DayPlan[typeof type];
  foods: Awaited<ReturnType<typeof listFoods>>;
  locale: Locale;
}) {
  const s = t(S, locale);
  return (
    <section className="flex min-h-24 flex-col gap-1 rounded-lg border border-border p-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {MEAL_TYPE_LABELS[locale][type]}
        </span>
        <span className="flex items-center gap-0.5">
          {items.length > 0 && (
            <form action={logPlannedMeal.bind(null, day, type)}>
              <button
                type="submit"
                title={s.logToday}
                aria-label={s.logToday}
                className="rounded p-0.5 text-muted-foreground transition-colors hover:text-primary"
              >
                <Utensils className="size-3.5" />
              </button>
            </form>
          )}
          <PlanItemDialog dayOfWeek={day} mealType={type} foods={foods} />
        </span>
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
                aria-label={s.remove(it.foodName)}
                className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
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
