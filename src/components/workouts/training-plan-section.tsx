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
import {
  WEEKDAY_LABELS,
  WORKOUT_TYPES,
  WORKOUT_TYPE_LABELS,
  type WorkoutType,
} from "@/lib/labels";
import type { RoutineWithItems } from "@/lib/queries/routines";
import { useLocale, useT } from "@/lib/use-locale";
import { cn } from "cn";

const S = {
  es: {
    title: "Plan semanal",
    addOn: (day: string) => `Agregar el ${day}`,
    workoutOf: (day: string) => `Entreno del ${day}`,
    routine: "Rutina (opcional)",
    noRoutine: "— sin rutina —",
    name: "Nombre",
    minutes: "Minutos",
    type: "Tipo",
    add: "Agregar",
    saving: "Guardando…",
    errorNoName: "Indicá un nombre o elegí una rutina.",
    namePlaceholder: "Ej: Cardio zona 2",
    logOn: (title: string, day: string) => `Loggear ${title} el ${day}`,
    remove: (title: string) => `Quitar ${title}`,
  },
  en: {
    title: "Weekly plan",
    addOn: (day: string) => `Add on ${day}`,
    workoutOf: (day: string) => `${day}'s workout`,
    routine: "Routine (optional)",
    noRoutine: "— no routine —",
    name: "Name",
    minutes: "Minutes",
    type: "Type",
    add: "Add",
    saving: "Saving…",
    errorNoName: "Enter a name or pick a routine.",
    namePlaceholder: "E.g.: Zone 2 cardio",
    logOn: (title: string, day: string) => `Log ${title} on ${day}`,
    remove: (title: string) => `Remove ${title}`,
  },
};

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
  const s = useT(S);
  const days = WEEKDAY_LABELS[useLocale()];

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{s.title}</h2>
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[60rem] grid-cols-7 gap-3">
          {days.map((day, d) => (
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
  const s = useT(S);
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
                aria-label={s.logOn(it.title, day)}
                className="shrink-0 rounded p-0.5 text-primary opacity-0 transition-opacity hover:bg-primary/10 group-hover:opacity-100"
              >
                <Play className="size-3.5" />
              </button>
            )}
            <form action={deleteTrainingPlanItem.bind(null, it.id)}>
              <button
                type="submit"
                aria-label={s.remove(it.title)}
                className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
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
  const s = useT(S);
  const locale = useLocale();

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
      setError(s.errorNoName);
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
        aria-label={s.addOn(dayLabel)}
      >
        <Plus />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{s.workoutOf(dayLabel)}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="plan-routine">{s.routine}</Label>
              <select
                id="plan-routine"
                value={routineId}
                onChange={(e) => pickRoutine(e.target.value)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                <option value="">{s.noRoutine}</option>
                {routines.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="plan-title">{s.name}</Label>
                <Input
                  id="plan-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={s.namePlaceholder}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="plan-min">{s.minutes}</Label>
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
              <Label htmlFor="plan-type">{s.type}</Label>
              <select
                id="plan-type"
                value={type}
                onChange={(e) => setType(e.target.value as WorkoutType)}
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              >
                {WORKOUT_TYPES.map((wt) => (
                  <option key={wt} value={wt}>
                    {WORKOUT_TYPE_LABELS[locale][wt]}
                  </option>
                ))}
              </select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={pending}>
              {pending ? s.saving : s.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
