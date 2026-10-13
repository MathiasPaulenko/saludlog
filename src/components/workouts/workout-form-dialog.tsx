"use client";

import { Plus, X } from "lucide-react";
import {
  useState,
  useTransition,
  type ComponentProps,
  type ReactNode,
} from "react";
import { logWorkout, updateWorkout } from "@/actions/workouts";
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
import {
  WORKOUT_TYPES,
  WORKOUT_TYPE_LABELS,
  type WorkoutType,
} from "@/lib/labels";
import type { ExerciseOption } from "@/lib/queries/exercises";
import type { WorkoutWithSets } from "@/lib/queries/workouts";
import { useLocale, useT } from "@/lib/use-locale";

const S = {
  es: {
    editWorkout: "Editar entreno",
    logWorkout: "Registrar entreno",
    date: "Fecha",
    type: "Tipo",
    duration: "Duración (min)",
    notes: "Notas",
    optional: "Opcional",
    exercise: "Ejercicio",
    sets: "Series",
    reps: "Reps",
    removeSet: "Quitar serie",
    addSet: "Agregar serie",
    saving: "Guardando…",
    save: "Guardar cambios",
    log: "Registrar",
    errorEmpty: "Indicá duración o al menos una serie.",
  },
  en: {
    editWorkout: "Edit workout",
    logWorkout: "Log workout",
    date: "Date",
    type: "Type",
    duration: "Duration (min)",
    notes: "Notes",
    optional: "Optional",
    exercise: "Exercise",
    sets: "Sets",
    reps: "Reps",
    removeSet: "Remove set",
    addSet: "Add set",
    saving: "Saving…",
    save: "Save changes",
    log: "Log",
    errorEmpty: "Enter a duration or at least one set.",
  },
};

interface SetRow {
  key: number;
  exercise: string;
  sets: string;
  reps: string;
  weightKg: string;
}

interface WorkoutFormDialogProps {
  defaultDate: string;
  exercises: ExerciseOption[];
  workout?: WorkoutWithSets;
  label: ReactNode;
  icon?: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  buttonClassName?: string;
}

export function WorkoutFormDialog({
  defaultDate,
  exercises,
  workout,
  label,
  icon,
  variant = "default",
  size = "default",
  buttonClassName,
}: WorkoutFormDialogProps) {
  const s = useT(S);
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{workout ? s.editWorkout : s.logWorkout}</DialogTitle>
          </DialogHeader>
          {open && (
            <WorkoutForm
              key={workout?.id ?? "new"}
              defaultDate={defaultDate}
              exercises={exercises}
              workout={workout}
              onDone={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

const exerciseIdByName = (exercises: ExerciseOption[]) =>
  new Map(exercises.map((e) => [e.name.toLowerCase(), e.id]));

function WorkoutForm({
  defaultDate,
  exercises,
  workout,
  onDone,
}: Pick<WorkoutFormDialogProps, "defaultDate" | "exercises" | "workout"> & {
  onDone: () => void;
}) {
  const s = useT(S);
  const locale = useLocale();
  const idByName = exerciseIdByName(exercises);
  const [date, setDate] = useState(workout?.date ?? defaultDate);
  const [type, setType] = useState<WorkoutType>(workout?.type ?? "gym");
  const [durationMin, setDurationMin] = useState(
    workout?.durationMin?.toString() ?? "",
  );
  const [notes, setNotes] = useState(workout?.notes ?? "");
  const [sets, setSets] = useState<SetRow[]>(() =>
    workout && workout.sets.length > 0
      ? workout.sets.map((s) => ({
          key: s.id,
          exercise: s.exercise,
          sets: String(s.sets),
          reps: String(s.reps),
          weightKg: s.weightKg != null ? String(s.weightKg) : "",
        }))
      : [],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateSet(key: number, patch: Partial<SetRow>) {
    setSets((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addSet() {
    setSets((prev) => [
      ...prev,
      {
        key: Math.max(0, ...prev.map((r) => r.key)) + 1,
        exercise: "",
        sets: "",
        reps: "",
        weightKg: "",
      },
    ]);
  }

  function removeSet(key: number) {
    setSets((prev) => prev.filter((r) => r.key !== key));
  }

  function handleSubmit() {
    const parsedSets = sets
      .filter((r) => r.exercise.trim() && Number(r.sets) > 0 && Number(r.reps) > 0)
      .map((r) => ({
        exercise: r.exercise.trim(),
        exerciseId: idByName.get(r.exercise.trim().toLowerCase()),
        sets: Number(r.sets),
        reps: Number(r.reps),
        weightKg: r.weightKg !== "" ? Number(r.weightKg) : undefined,
      }));

    const duration = durationMin !== "" ? Number(durationMin) : undefined;
    if (duration === undefined && parsedSets.length === 0) {
      setError(s.errorEmpty);
      return;
    }

    const payload = {
      date,
      type,
      durationMin: duration,
      notes: notes || undefined,
      sets: parsedSets,
    };
    startTransition(async () => {
      const res = workout
        ? await updateWorkout(workout.id, payload)
        : await logWorkout(payload);
      if (res.ok) {
        onDone();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="workout-date">{s.date}</Label>
          <Input
            id="workout-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="workout-type">{s.type}</Label>
          <select
            id="workout-type"
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="workout-duration">{s.duration}</Label>
          <Input
            id="workout-duration"
            type="number"
            min="0"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="workout-notes">{s.notes}</Label>
          <Input
            id="workout-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={s.optional}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_4.5rem_4.5rem_5rem_2rem] items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>{s.exercise}</span>
          <span>{s.sets}</span>
          <span>{s.reps}</span>
          <span>Kg</span>
          <span />
        </div>
        {sets.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[1fr_4.5rem_4.5rem_5rem_2rem] items-center gap-2"
          >
            <Input
              list="exercise-catalog"
              value={row.exercise}
              onChange={(e) => updateSet(row.key, { exercise: e.target.value })}
              placeholder="Ej: Barbell Bench Press"
            />
            <Input
              type="number"
              min="0"
              value={row.sets}
              onChange={(e) => updateSet(row.key, { sets: e.target.value })}
            />
            <Input
              type="number"
              min="0"
              value={row.reps}
              onChange={(e) => updateSet(row.key, { reps: e.target.value })}
            />
            <Input
              type="number"
              min="0"
              step="any"
              value={row.weightKg}
              onChange={(e) => updateSet(row.key, { weightKg: e.target.value })}
              placeholder="—"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeSet(row.key)}
              aria-label={s.removeSet}
            >
              <X />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addSet} className="w-fit">
          <Plus />
          {s.addSet}
        </Button>
        <datalist id="exercise-catalog">
          {exercises.map((e) => (
            <option
              key={e.id}
              value={e.name}
              label={e.primaryMuscles?.join(", ") || e.equipment || undefined}
            />
          ))}
        </datalist>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={pending}>
          {pending ? s.saving : workout ? s.save : s.log}
        </Button>
      </DialogFooter>
    </div>
  );
}
