"use client";

import { addDays, format } from "date-fns";
import { Play, Plus, X } from "lucide-react";
import { useState, useTransition } from "react";
import { applyRoutine } from "@/actions/routines";
import {
  addTrainingPlanItem,
  deleteTrainingPlanItem,
} from "@/actions/training-plan";
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
import type { TrainingPlanItem } from "@/db/schema";
import { WORKOUT_TYPES, WORKOUT_TYPE_LABELS, type WorkoutType } from "@/lib/labels";
import type { RoutineWithItems } from "@/lib/queries/routines";
import { cn } from "cn";

const DAYS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export function TrainingPlanSection({
  plan,
  routines,
  weekStart,
}: {
  plan: Record<number, TrainingPlanItem[]>;
  routines: RoutineWithItems[];
  weekStart: string;
}) {
  const today = (new Date().getDay() + 6) % 7;

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Plan semanal</h2>
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[60rem] grid-cols-7 gap-3">
          {DAYS.map((day, d) => (
            <DayColumn
              key={day}
              day={day}
              dayIndex={d}
              isToday={d === today}
              items={plan[d]}
              routines={routines}
              date={format(addDays(new Date(weekStart + "T00:00:00"), d), "yyyy-MM-dd")}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayColumn({
  day,
  dayIndex,
  isToday,
  items,
  routines,
  date,
}: {
  day: string;
  dayIndex: number;
  isToday: boolean;
  items: TrainingPlanItem[];
  routines: RoutineWithItems[];
  date: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <section className="flex min-h-28 flex-col gap-1.5 rounded-lg border border-border p-2">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-xs font-medium text-muted-foreground",
            isToday && "font-semibold text-primary",
          )}
        >
          {day}
        </span>
        <AddPlanItemDialog dayOfWeek={dayIndex} dayLabel={day} routines={routines} />
      </div>
      <ul className="flex flex-col">
        {items.map((it) => (
          <li
            key={it.id}
            className="group flex items-center gap-1.5 rounded px-1 py-1 text-sm hover:bg-accent"
          >
            <span className="size-1.5 shrink-0 rounded-full bg-primary" />
            <span className="min-w-0 flex-1 truncate">
              {it.title}
              {it.durationMin != null && (
                <span className="text-muted-foreground">
                  {" "}
                  · {it.durationMin}m
                </span>
              )}
            </span>
            {it.routineId != null && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(() => {
                    void applyRoutine(it.routineId!, date);
                  })
                }
                aria-label={`Loggear ${it.title} el ${day}`}
                className="hidden shrink-0 rounded p-0.5 text-primary hover:bg-primary/10 group-hover:block"
              >
                <Play className="size-3.5" />
              </button>
            )}
            <form action={deleteTrainingPlanItem.bind(null, it.id)}>
              <button
                type="submit"
                aria-label={`Quitar ${it.title}`}
                className="hidden shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive group-hover:block"
              >
                <X className="size-3.5" />
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AddPlanItemDialog({
  dayOfWeek,
  dayLabel,
  routines,
}: {
  dayOfWeek: number;
  dayLabel: string;
  routines: RoutineWithItems[];
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<WorkoutType>("gym");
  const [routineId, setRoutineId] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function pickRoutine(id: string) {
    setRoutineId(id);
    const r = routines.find((x) => x.id === Number(id));
    if (r) {
      setTitle(r.name);
      setType("gym");
    }
  }

  function handleSubmit() {
    if (!title.trim()) {
      setError("Indicá un nombre o elegí una rutina.");
      return;
    }
    startTransition(async () => {
      const res = await addTrainingPlanItem({
        dayOfWeek,
        title: title.trim(),
        workoutType: type,
        routineId: routineId ? Number(routineId) : undefined,
        durationMin: durationMin ? Number(durationMin) : undefined,
      });
      if (res.ok) {
        setOpen(false);
        setTitle("");
        setRoutineId("");
        setDurationMin("");
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label={`Agregar el ${dayLabel}`}
      >
        <Plus />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entreno del {dayLabel}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-routine">Rutina (opcional)</Label>
              <select
                id="plan-routine"
                value={routineId}
                onChange={(e) => pickRoutine(e.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">— sin rutina —</option>
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="plan-title">Nombre</Label>
                <Input
                  id="plan-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Cardio zona 2"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plan-min">Minutos</Label>
                <Input
                  id="plan-min"
                  type="number"
                  min="0"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  placeholder="—"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-type">Tipo</Label>
              <select
                id="plan-type"
                value={type}
                onChange={(e) => setType(e.target.value as WorkoutType)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {WORKOUT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {WORKOUT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? "Guardando…" : "Agregar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
