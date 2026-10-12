import { Suspense } from "react";
import { FoodsClient } from "@/components/foods/foods-client";
import { listFoods } from "@/lib/queries/foods";

export default function FoodsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Alimentos</h1>
      <Suspense fallback={<p className="text-muted-foreground">Cargando…</p>}>
        <FoodsSection />
      </Suspense>
    </div>
  );
}

async function FoodsSection() {
  const foods = await listFoods();
  return <FoodsClient foods={foods} />;
}
