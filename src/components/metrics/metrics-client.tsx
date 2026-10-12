"use client";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Pencil, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteMetric } from "@/actions/metrics";
import { MetricFormDialog } from "@/components/metrics/metric-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BodyMetric } from "@/db/schema";

export function MetricsClient({ metrics }: { metrics: BodyMetric[] }) {
  const [, startTransition] = useTransition();

  function handleDelete(metric: BodyMetric) {
    if (!window.confirm(`¿Eliminar el registro del ${metric.date}?`)) return;
    startTransition(() => deleteMetric(metric.id));
  }

  return (
    <div className="max-w-3xl rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Peso (kg)</TableHead>
            <TableHead className="text-right">% Grasa</TableHead>
            <TableHead className="text-right">Cintura (cm)</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">
                {format(parseISO(m.date), "d MMM yyyy", { locale: es })}
              </TableCell>
              <TableCell className="text-right">{m.weightKg}</TableCell>
              <TableCell className="text-right">
                {m.bodyFatPct ?? "—"}
              </TableCell>
              <TableCell className="text-right">{m.waistCm ?? "—"}</TableCell>
              <TableCell className="max-w-40 truncate text-muted-foreground">
                {m.notes ?? ""}
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <MetricFormDialog
                    defaultDate={m.date}
                    metric={m}
                    label=""
                    icon={<Pencil />}
                    variant="ghost"
                    size="icon-sm"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(m)}
                    aria-label={`Eliminar registro del ${m.date}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {metrics.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={6}
                className="py-8 text-center text-muted-foreground"
              >
                Todavía no hay registros.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
