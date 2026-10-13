"use client";

import { format, parseISO } from "date-fns";
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
import { dateFnsLocale } from "@/lib/i18n-shared";
import { useLocale, useT } from "@/lib/use-locale";

const S = {
  es: {
    confirmDelete: (d: string) => `¿Eliminar el registro del ${d}?`,
    deleteLabel: (d: string) => `Eliminar registro del ${d}`,
    date: "Fecha",
    weight: "Peso (kg)",
    fat: "% Grasa",
    waist: "Cintura (cm)",
    notes: "Notas",
    empty: "Todavía no hay registros.",
    dateFormat: "d MMM yyyy",
  },
  en: {
    confirmDelete: (d: string) => `Delete the entry for ${d}?`,
    deleteLabel: (d: string) => `Delete entry for ${d}`,
    date: "Date",
    weight: "Weight (kg)",
    fat: "% Fat",
    waist: "Waist (cm)",
    notes: "Notes",
    empty: "No records yet.",
    dateFormat: "MMM d, yyyy",
  },
};

export function MetricsClient({ metrics }: { metrics: BodyMetric[] }) {
  const [, startTransition] = useTransition();
  const s = useT(S);
  const loc = dateFnsLocale(useLocale());

  function handleDelete(metric: BodyMetric) {
    if (!window.confirm(s.confirmDelete(metric.date))) return;
    startTransition(() => deleteMetric(metric.id));
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{s.date}</TableHead>
            <TableHead className="text-right">{s.weight}</TableHead>
            <TableHead className="text-right">{s.fat}</TableHead>
            <TableHead className="text-right">{s.waist}</TableHead>
            <TableHead>{s.notes}</TableHead>
            <TableHead className="w-24" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">
                {format(parseISO(m.date), s.dateFormat, { locale: loc })}
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
                    aria-label={s.deleteLabel(m.date)}
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
                {s.empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
