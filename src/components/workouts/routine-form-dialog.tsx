"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import {
  useState,
  useTransition,
  type ComponentProps,
  type ReactNode,
} from "react";
import { saveRoutine } from "@/actions/routines";
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
import type { ExerciseOption } from "@/lib/queries/exercises";
import type { RoutineWithItems } from "@/lib/queries/routines";

interface ItemRow {
  key: number;
  exercise: string;
  sets: string;
  reps: string;
  weightKg: string;
}

interface RoutineFormDialogProps {
  exercises: ExerciseOption[];
  routine?: RoutineWithItems;
  label: ReactNode;
  icon?: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
}

export function RoutineFormDialog({
  exercises,
  routine,
  label,
  icon,
  variant = "default",
  size = "default",
}: RoutineFormDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        {icon}
        {label}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {routine ? "Editar rutina" : "Nueva rutina"}
            </DialogTitle>
          </DialogHeader>
          {open && (
            <RoutineForm
              key={routine?.id ?? "new"}
              exercises={exercises}
              routine={routine}
              onDone={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RoutineForm({
  exercises,
  routine,
  onDone,
}: Pick<RoutineFormDialogProps, "exercises" | "routine"> & {
  onDone: () => void;
}) {
  const idByName = new Map(exercises.map((e) => [e.name.toLowerCase(), e.id]));
  const [name, setName] = useState(routine?.name ?? "");
  const [notes, setNotes] = useState(routine?.notes ?? "");
  const [items, setItems] = useState<ItemRow[]>(() =>
    routine && routine.items.length > 0
      ? routine.items.map((i) => ({
          key: i.id,
          exercise: i.exercise,
          sets: String(i.sets),
          reps: String(i.reps),
          weightKg: i.weightKg != null ? String(i.weightKg) : "",
        }))
      : [{ key: 1, exercise: "", sets: "", reps: "", weightKg: "" }],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const update = (key: number, patch: Partial<ItemRow>) =>
    setItems((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      {
        key: Math.max(0, ...prev.map((r) => r.key)) + 1,
        exercise: "",
        sets: "",
        reps: "",
        weightKg: "",
      },
    ]);

  const removeItem = (key: number) =>
    setItems((prev) => prev.filter((r) => r.key !== key));

  const move = (key: number, dir: -1 | 1) =>
    setItems((prev) => {
      const idx = prev.findIndex((r) => r.key === key);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  function handleSubmit() {
    const parsed = items
      .filter((r) => r.exercise.trim() && Number(r.sets) > 0 && Number(r.reps) > 0)
      .map((r) => ({
        exercise: r.exercise.trim(),
        exerciseId: idByName.get(r.exercise.trim().toLowerCase()),
        sets: Number(r.sets),
        reps: Number(r.reps),
        weightKg: r.weightKg !== "" ? Number(r.weightKg) : undefined,
      }));
    if (!name.trim()) {
      setError("La rutina necesita un nombre.");
      return;
    }
    if (parsed.length === 0) {
      setError("Agregá al menos un ejercicio con series y reps.");
      return;
    }
    startTransition(async () => {
      const res = await saveRoutine(routine?.id ?? null, {
        name: name.trim(),
        notes: notes || undefined,
        items: parsed,
      });
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="routine-name">Nombre</Label>
          <Input
            id="routine-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Push / Pull / Legs"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="routine-notes">Notas</Label>
          <Input
            id="routine-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Opcional"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-[1fr_4.5rem_4.5rem_5rem_4.5rem_2rem] items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>Ejercicio</span>
          <span>Series</span>
          <span>Reps</span>
          <span>Kg</span>
          <span />
          <span />
        </div>
        {items.map((row, idx) => (
          <div
            key={row.key}
            className="grid grid-cols-[1fr_4.5rem_4.5rem_5rem_4.5rem_2rem] items-center gap-2"
          >
            <Input
              list="routine-exercise-catalog"
              value={row.exercise}
              onChange={(e) => update(row.key, { exercise: e.target.value })}
              placeholder="Ej: Barbell Squat"
            />
            <Input
              type="number"
              min="0"
              value={row.sets}
              onChange={(e) => update(row.key, { sets: e.target.value })}
            />
            <Input
              type="number"
              min="0"
              value={row.reps}
              onChange={(e) => update(row.key, { reps: e.target.value })}
            />
            <Input
              type="number"
              min="0"
              step="any"
              value={row.weightKg}
              onChange={(e) => update(row.key, { weightKg: e.target.value })}
              placeholder="—"
            />
            <div className="flex">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => move(row.key, -1)}
                disabled={idx === 0}
                aria-label="Subir"
              >
                <ArrowUp />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => move(row.key, 1)}
                disabled={idx === items.length - 1}
                aria-label="Bajar"
              >
                <ArrowDown />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => removeItem(row.key)}
              aria-label="Quitar ejercicio"
            >
              <X />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addItem} className="w-fit">
          <Plus />
          Agregar ejercicio
        </Button>
        <datalist id="routine-exercise-catalog">
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
          {pending ? "Guardando…" : "Guardar rutina"}
        </Button>
      </DialogFooter>
    </div>
  );
}
