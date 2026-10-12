import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import { BASE_UNIT_LABELS, MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/labels";
import { computeMealMacros, roundMacros } from "@/lib/macros";
import { listFoods } from "@/lib/queries/foods";
import { getDayTotals, getMealsForDate, type MealWithItems } from "@/lib/queries/meals";

export default function MealsPage({ searchParams }: PageProps<"/meals">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Comidas</h1>
      <Suspense fallback={<p className="text-muted-foreground">Cargando…</p>}>
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
  const { date: raw } = await searchParams;
  const date =
    typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? raw
      : format(new Date(), "yyyy-MM-dd");

  const [dayMeals, allFoods, totals] = await Promise.all([
    getMealsForDate(date),
    listFoods(),
    getDayTotals(date),
  ]);
  const t = roundMacros(totals);
  const dateLabel = format(new Date(`${date}T12:00:00`), "EEEE d 'de' MMMM", {
    locale: es,
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <DateNav date={date} />
        <MealFormDialog
          foods={allFoods}
          defaultDate={date}
          label="Registrar comida"
          icon={<Plus />}
          buttonClassName="ml-auto"
        />
      </div>

      <p className="text-sm capitalize text-muted-foreground">{dateLabel}</p>

      <div className="grid max-w-2xl grid-cols-4 gap-3">
        <Stat label="Calorías" value={`${t.kcal} kcal`} />
        <Stat label="Proteína" value={`${t.protein} g`} />
        <Stat label="Carbohidratos" value={`${t.carbs} g`} />
        <Stat label="Grasa" value={`${t.fat} g`} />
      </div>

      {dayMeals.length === 0 ? (
        <p className="text-muted-foreground">
          No hay comidas registradas este día.
        </p>
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          {MEAL_TYPES.map((type) =>
            dayMeals
              .filter((m) => m.type === type)
              .map((meal) => (
                <MealCard key={meal.id} meal={meal} foods={allFoods} />
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

function MealCard({ meal, foods }: { meal: MealWithItems; foods: Food[] }) {
  const macros = roundMacros(
    computeMealMacros(
      meal.items.map((i) => ({ food: i.food, amount: i.item.amount })),
    ),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline gap-3">
          <CardTitle>{MEAL_TYPE_LABELS[meal.type]}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {macros.kcal} kcal
          </span>
        </div>
        <CardAction className="flex items-center gap-1">
          <MealFormDialog
            foods={foods}
            defaultDate={meal.date}
            meal={meal}
            label="Editar"
            variant="ghost"
            size="sm"
          />
          <form action={repeatMeal.bind(null, meal.id)}>
            <Button variant="ghost" size="sm" type="submit">
              <Repeat />
              Repetir hoy
            </Button>
          </form>
          <form action={deleteMeal.bind(null, meal.id)}>
            <ConfirmSubmit
              message="¿Eliminar esta comida?"
              className="inline-flex h-7 items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
            >
              Eliminar
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
            {meal.items.length} alimento{meal.items.length === 1 ? "" : "s"} · P{" "}
            {macros.protein} g · C {macros.carbs} g · G {macros.fat} g
          </summary>
          <Table className="mt-2">
            <TableHeader>
              <TableRow>
                <TableHead>Alimento</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">kcal</TableHead>
                <TableHead className="text-right">Prot.</TableHead>
                <TableHead className="text-right">Carbs</TableHead>
                <TableHead className="text-right">Grasa</TableHead>
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
                <TableCell colSpan={2}>Total</TableCell>
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
