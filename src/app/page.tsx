import { format } from "date-fns";
import { es } from "date-fns/locale";
import { connection } from "next/server";
import { Suspense } from "react";

async function TodayDate() {
  await connection();
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es });
  return (
    <p className="mt-1 text-sm capitalize text-muted-foreground">{today}</p>
  );
}

export default function TodayPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Hoy</h1>
      <Suspense fallback={null}>
        <TodayDate />
      </Suspense>
      <p className="mt-6 text-muted-foreground">
        Acá va el resumen del día: comidas, entreno, hábitos y peso.
      </p>
    </div>
  );
}
