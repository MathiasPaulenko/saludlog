import { format } from "date-fns";
import { Plus } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { MetricFormDialog } from "@/components/metrics/metric-form-dialog";
import { MetricsClient } from "@/components/metrics/metrics-client";
import { listMetrics } from "@/lib/queries/metrics";

export default function MetricsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Peso</h1>
      <Suspense fallback={<p className="text-muted-foreground">Cargando…</p>}>
        <MetricsSection />
      </Suspense>
    </div>
  );
}

async function MetricsSection() {
  await connection();
  const metrics = await listMetrics();
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <>
      <MetricFormDialog
        defaultDate={today}
        label="Registrar peso"
        icon={<Plus />}
        buttonClassName="w-fit"
      />
      <MetricsClient metrics={metrics} />
    </>
  );
}
