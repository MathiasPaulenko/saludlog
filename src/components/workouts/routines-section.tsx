"use client";

import { Play } from "lucide-react";
import { useTransition } from "react";
import { applyRoutine, deleteRoutine } from "@/actions/routines";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { RoutineFormDialog } from "@/components/workouts/routine-form-dialog";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ExerciseOption } from "@/lib/queries/exercises";
import type { RoutineWithItems } from "@/lib/queries/routines";

export function RoutinesSection({
  routines,
  exercises,
  date,
}: {
  routines: RoutineWithItems[];
  exercises: ExerciseOption[];
  date: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Rutinas</h2>
        <RoutineFormDialog
          exercises={exercises}
          label="Nueva rutina"
          variant="outline"
          size="sm"
        />
      </div>
      {routines.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Armá tu primera rutina y usála para loggear el entreno en un click.
        </p>
      ) : (
        <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
          {routines.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="text-base">{r.name}</CardTitle>
                <CardAction className="flex items-center gap-1">
                  <RoutineFormDialog
                    exercises={exercises}
                    routine={r}
                    label="Editar"
                    variant="ghost"
                    size="sm"
                  />
                  <form action={deleteRoutine.bind(null, r.id)}>
                    <ConfirmSubmit
                      message="¿Eliminar esta rutina?"
                      className="inline-flex h-7 items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    >
                      Eliminar
                    </ConfirmSubmit>
                  </form>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {r.items.length} ejercicio{r.items.length === 1 ? "" : "s"}
                  {" · "}
                  {r.items.map((i) => i.exercise).join(", ")}
                </p>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => {
                      void applyRoutine(r.id, date);
                    })
                  }
                  className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Play className="size-3.5" />
                  Usar rutina
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
