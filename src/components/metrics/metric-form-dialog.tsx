"use client";

import { useState, useTransition, type ComponentProps, type ReactNode } from "react";
import { upsertMetric } from "@/actions/metrics";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BodyMetric } from "@/db/schema";

interface MetricFormDialogProps {
  defaultDate: string;
  metric?: BodyMetric;
  label: ReactNode;
  icon?: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  buttonClassName?: string;
}

export function MetricFormDialog({
  defaultDate,
  metric,
  label,
  icon,
  variant = "default",
  size = "default",
  buttonClassName,
}: MetricFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={buttonClassName}
        onClick={() => setOpen(true)}
      >
        {icon}
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{metric ? "Editar registro" : "Registrar peso"}</DialogTitle>
          </DialogHeader>
          {open && (
            <MetricForm
              key={metric?.id ?? "new"}
              defaultDate={defaultDate}
              metric={metric}
              onDone={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function MetricForm({
  defaultDate,
  metric,
  onDone,
}: Pick<MetricFormDialogProps, "defaultDate" | "metric"> & {
  onDone: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = (name: string) => {
      const raw = fd.get(name);
      return raw !== null && raw !== "" ? Number(raw) : undefined;
    };
    const payload = {
      date: fd.get("date"),
      weightKg: num("weightKg"),
      bodyFatPct: num("bodyFatPct"),
      waistCm: num("waistCm"),
      notes: (fd.get("notes") as string) || undefined,
    };
    startTransition(async () => {
      const res = await upsertMetric(payload);
      if (res.ok) {
        onDone();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="metric-date">Fecha</Label>
        <Input
          id="metric-date"
          name="date"
          type="date"
          required
          defaultValue={metric?.date ?? defaultDate}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="metric-weight">Peso (kg)</Label>
          <Input
            id="metric-weight"
            name="weightKg"
            type="number"
            min="0"
            step="any"
            required
            defaultValue={metric?.weightKg}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="metric-fat">% Grasa</Label>
          <Input
            id="metric-fat"
            name="bodyFatPct"
            type="number"
            min="0"
            max="100"
            step="any"
            defaultValue={metric?.bodyFatPct ?? undefined}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="metric-waist">Cintura (cm)</Label>
          <Input
            id="metric-waist"
            name="waistCm"
            type="number"
            min="0"
            step="any"
            defaultValue={metric?.waistCm ?? undefined}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="metric-notes">Notas</Label>
        <Input
          id="metric-notes"
          name="notes"
          placeholder="Opcional"
          defaultValue={metric?.notes ?? ""}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
