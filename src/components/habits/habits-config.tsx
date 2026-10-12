"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import {
  createHabit,
  deleteHabit,
  moveHabit,
  setHabitActive,
} from "@/actions/habits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Habit } from "@/db/schema";
import { HABIT_UNITS, HABIT_UNIT_LABELS } from "@/lib/labels";
import { cn } from "cn";

export function HabitsConfig({ habits }: { habits: Habit[] }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const target = fd.get("targetDaily");
    const input = {
      name: fd.get("name"),
      unit: fd.get("unit"),
      targetDaily: target !== null && target !== "" ? Number(target) : undefined,
    };
    startTransition(async () => {
      const res = await createHabit(input);
      if (res.ok) {
        form.reset();
        setError(null);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <h2 className="text-lg font-semibold">Configurar hábitos</h2>

      <div className="flex flex-col gap-1">
        {habits.map((habit, i) => (
          <div
            key={habit.id}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border px-3 py-2",
              !habit.active && "opacity-50",
            )}
          >
            <span className="flex-1 truncate text-sm">
              {habit.name}
              <span className="ml-2 text-xs text-muted-foreground">
                {HABIT_UNIT_LABELS[habit.unit]}
                {habit.targetDaily != null && ` · meta ${habit.targetDaily}`}
              </span>
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                startTransition(async () => {
                  await moveHabit(habit.id, "up");
                })
              }
              disabled={i === 0 || pending}
              aria-label={`Subir ${habit.name}`}
            >
              <ArrowUp />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() =>
                startTransition(async () => {
                  await moveHabit(habit.id, "down");
                })
              }
              disabled={i === habits.length - 1 || pending}
              aria-label={`Bajar ${habit.name}`}
            >
              <ArrowDown />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                startTransition(async () => {
                  await setHabitActive(habit.id, !habit.active);
                })
              }
              disabled={pending}
            >
              {habit.active ? "Pausar" : "Activar"}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                if (!window.confirm(`¿Eliminar "${habit.name}"? Si tiene historial queda desactivado.`)) return;
                startTransition(() => deleteHabit(habit.id));
              }}
              disabled={pending}
              aria-label={`Eliminar ${habit.name}`}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        {habits.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No hay hábitos configurados.
          </p>
        )}
      </div>

      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-2 rounded-lg border border-border p-3"
      >
        <div className="flex min-w-40 flex-1 flex-col gap-1.5">
          <label htmlFor="habit-name" className="text-xs text-muted-foreground">
            Nombre
          </label>
          <Input
            id="habit-name"
            name="name"
            required
            placeholder="Ej: Lectura"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="habit-unit" className="text-xs text-muted-foreground">
            Unidad
          </label>
          <select
            id="habit-unit"
            name="unit"
            defaultValue="check"
            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
          >
            {HABIT_UNITS.map((u) => (
              <option key={u} value={u}>
                {HABIT_UNIT_LABELS[u]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex w-28 flex-col gap-1.5">
          <label
            htmlFor="habit-target"
            className="text-xs text-muted-foreground"
          >
            Meta diaria
          </label>
          <Input
            id="habit-target"
            name="targetDaily"
            type="number"
            min="0"
            step="any"
            placeholder="—"
          />
        </div>
        <Button type="submit" disabled={pending}>
          <Plus />
          Agregar
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
