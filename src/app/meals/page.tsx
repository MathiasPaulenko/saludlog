import { format } from "date-fns";
import { Plus, Repeat } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { deleteMeal, repeatMeal } from "@/actions/meals";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { DateNav } from "@/components/meals/date-nav";
import { MealFormDialog } from "@/components/meals/meal-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Food } from "@/db/schema";
import {
  dateFnsLocale,
  getLocale,
  t,
  type Locale,
} from "@/lib/i18n";
import { BASE_UNIT_LABELS, MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/labels";
import { computeMealMacros, roundMacros } from "@/lib/macros";
import { listFoods } from "@/lib/queries/foods";
import { getDayTotals, getMealsForDate, type MealWithItems } from "@/lib/queries/meals";

const S = {
  es: {
    title: "Comidas",
    logMeal: "Registrar comida",
    edit: "Editar",
    calories: "Calorías",
    protein: "Proteína",
    carbs: "Carbohidratos",
    fat: "Grasa",
    noMeals: "No hay comidas registradas este día.",
    repeatToday: "Repetir hoy",
    delete: "Eliminar",
    confirmDelete: "¿Eliminar esta comida?",
    food: "alimento",
    foodsWord: "alimentos",
    foodCol: "Alimento",
    amountCol: "Cantidad",
    protCol: "Prot.",
    carbsCol: "Carbs",
    fatCol: "Grasa",
    total: "Total",
  },
  en: {
    title: "Meals",
    logMeal: "Log meal",
    edit: "Edit",
    calories: "Calories",
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fat",
    noMeals: "No meals logged this day.",
    repeatToday: "Repeat today",
    delete: "Delete",
    confirmDelete: "Delete this meal?",
    food: "food",
    foodsWord: "foods",
    foodCol: "Food",
    amountCol: "Amount",
    protCol: "Prot.",
    carbsCol: "Carbs",
    fatCol: "Fat",
    total: "Total",
  },
};

export default function MealsPage({ searchParams }: PageProps<"/meals">) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <MealsDay searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function MealsDay({
  searchParams,
}: {
  searchParams: PageProps<"/meals">["searchParams"];
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

  const [dayMeals, allFoods, totals] = await Promise.all([
    getMealsForDate(date),
    listFoods(),
    getDayTotals(date),
  ]);
  const tm = roundMacros(totals);
  const dateLabel = format(
    new Date(`${date}T12:00:00`),
    locale === "en" ? "EEEE, MMMM d" : "EEEE d 'de' MMMM",
    { locale: loc },
  );

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
      <div className="flex flex-wrap items-center gap-3">
        <DateNav date={date} />
        <MealFormDialog
          foods={allFoods}
          defaultDate={date}
          label={s.logMeal}
          icon={<Plus />}
          buttonClassName="ml-auto"
        />
      </div>

      <p className="text-sm capitalize text-muted-foreground">{dateLabel}</p>

      <div className="grid max-w-2xl grid-cols-4 gap-3">
        <Stat label={s.calories} value={`${tm.kcal} kcal`} />
        <Stat label={s.protein} value={`${tm.protein} g`} />
        <Stat label={s.carbs} value={`${tm.carbs} g`} />
        <Stat label={s.fat} value={`${tm.fat} g`} />
      </div>

      {dayMeals.length === 0 ? (
        <p className="text-muted-foreground">
          {s.noMeals}
        </p>
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          {MEAL_TYPES.map((type) =>
            dayMeals
              .filter((m) => m.type === type)
              .map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  foods={allFoods}
                  locale={locale}
                />
              )),
          )}
        </div>
      )}
    </>
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

function MealCard({
  meal,
  foods,
  locale,
}: {
  meal: MealWithItems;
  foods: Food[];
  locale: Locale;
}) {
  const s = t(S, locale);
  const macros = roundMacros(
    computeMealMacros(
      meal.items.map((i) => ({ food: i.food, amount: i.item.amount })),
    ),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline gap-3">
          <CardTitle>{MEAL_TYPE_LABELS[locale][meal.type]}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {macros.kcal} kcal
          </span>
        </div>
        <CardAction className="flex items-center gap-1">
          <MealFormDialog
            foods={foods}
            defaultDate={meal.date}
            meal={meal}
            label={s.edit}
            variant="ghost"
            size="sm"
          />
          <form action={repeatMeal.bind(null, meal.id)}>
            <Button variant="ghost" size="sm" type="submit">
              <Repeat />
              {s.repeatToday}
            </Button>
          </form>
          <form action={deleteMeal.bind(null, meal.id)}>
            <ConfirmSubmit
              message={s.confirmDelete}
              className="inline-flex h-7 items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
            >
              {s.delete}
            </ConfirmSubmit>
          </form>
        </CardAction>
      </CardHeader>
      <CardContent>
        {meal.notes && (
          <p className="mb-2 text-sm text-muted-foreground">{meal.notes}</p>
        )}
        <details>
          <summary className="cursor-pointer text-sm text-muted-foreground">
            {meal.items.length}{" "}
            {meal.items.length === 1 ? s.food : s.foodsWord} · P{" "}
            {macros.protein} g · C {macros.carbs} g · G {macros.fat} g
          </summary>
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead>{s.foodCol}</TableHead>
                <TableHead className="text-right">{s.amountCol}</TableHead>
                <TableHead className="text-right">kcal</TableHead>
                <TableHead className="text-right">{s.protCol}</TableHead>
                <TableHead className="text-right">{s.carbsCol}</TableHead>
                <TableHead className="text-right">{s.fatCol}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meal.items.map(({ item, food }) => {
                const m = roundMacros(
                  computeMealMacros([{ food, amount: item.amount }]),
                );
                return (
                  <TableRow key={item.id}>
                    <TableCell>{food.name}</TableCell>
                    <TableCell className="text-right">
                      {item.amount} {BASE_UNIT_LABELS[food.baseUnit]}
                    </TableCell>
                    <TableCell className="text-right">{m.kcal}</TableCell>
                    <TableCell className="text-right">{m.protein}</TableCell>
                    <TableCell className="text-right">{m.carbs}</TableCell>
                    <TableCell className="text-right">{m.fat}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={2}>{s.total}</TableCell>
                <TableCell className="text-right">{macros.kcal}</TableCell>
                <TableCell className="text-right">{macros.protein}</TableCell>
                <TableCell className="text-right">{macros.carbs}</TableCell>
                <TableCell className="text-right">{macros.fat}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </details>
      </CardContent>
    </Card>
  );
}
