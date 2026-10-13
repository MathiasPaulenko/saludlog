import { format } from "date-fns";
import { Plus } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { MetricFormDialog } from "@/components/metrics/metric-form-dialog";
import { MetricsClient } from "@/components/metrics/metrics-client";
import { getLocale, t } from "@/lib/i18n";
import { listMetrics } from "@/lib/queries/metrics";

const S = {
  es: { title: "Peso", logWeight: "Registrar peso" },
  en: { title: "Weight", logWeight: "Log weight" },
};

export default function MetricsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
        <MetricsSection />
      </Suspense>
    </div>
  );
}

async function MetricsSection() {
  await connection();
  const [metrics, locale] = await Promise.all([listMetrics(), getLocale()]);
  const s = t(S, locale);
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
      <MetricFormDialog
        defaultDate={today}
        label={s.logWeight}
        icon={<Plus />}
        buttonClassName="w-fit"
      />
      <MetricsClient metrics={metrics} />
    </>
  );
}
