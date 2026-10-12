import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { MealFormDialog } from "@/components/meals/meal-form-dialog";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { roundMacros } from "@/lib/macros";
import { listFoods } from "@/lib/queries/foods";
import { getDayTotals } from "@/lib/queries/meals";

export default function TodayPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Hoy</h1>
      <Suspense fallback={<p className="text-muted-foreground">Cargando…</p>}>
        <TodaySummary />
      </Suspense>
    </div>
  );
}

async function TodaySummary() {
  await connection();
  const today = format(new Date(), "yyyy-MM-dd");
  const [totals, foods] = await Promise.all([
    getDayTotals(today),
    listFoods(),
  ]);
  const t = roundMacros(totals);
  const dateLabel = format(new Date(), "EEEE d 'de' MMMM", { locale: es });

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <div>
          <CardTitle className="capitalize">{dateLabel}</CardTitle>
          <CardDescription>Resumen de comidas del día</CardDescription>
        </div>
        <CardAction>
          <MealFormDialog
            foods={foods}
            defaultDate={today}
            label="Registrar comida"
            icon={<Plus />}
            size="sm"
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Calorías" value={`${t.kcal} kcal`} />
          <Stat label="Proteína" value={`${t.protein} g`} />
          <Stat label="Carbs" value={`${t.carbs} g`} />
          <Stat label="Grasa" value={`${t.fat} g`} />
        </div>
        <Link
          href="/meals"
          className="w-fit text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Ver detalle del día
        </Link>
      </CardContent>
    </Card>
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
