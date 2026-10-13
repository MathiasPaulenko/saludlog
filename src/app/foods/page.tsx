import { Suspense } from "react";
import { FoodsClient } from "@/components/foods/foods-client";
import { getLocale, t } from "@/lib/i18n";
import { listFoods } from "@/lib/queries/foods";

const S = {
  es: { title: "Alimentos" },
  en: { title: "Foods" },
};

export default function FoodsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <FoodsSection />
      </Suspense>
    </div>
  );
}

async function FoodsSection() {
  const [foods, locale] = await Promise.all([listFoods(), getLocale()]);
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t(S, locale).title}
      </h1>
      <FoodsClient foods={foods} />
    </>
  );
}
