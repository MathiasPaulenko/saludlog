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
import { useT } from "@/lib/use-locale";

const S = {
  es: {
    title: "Rutinas",
    new: "Nueva rutina",
    empty: "Armá tu primera rutina y usála para loggear el entreno en un click.",
    edit: "Editar",
    delete: "Eliminar",
    confirmDelete: "¿Eliminar esta rutina?",
    exercise: "ejercicio",
    exercises: "ejercicios",
    use: "Usar rutina",
  },
  en: {
    title: "Routines",
    new: "New routine",
    empty: "Build your first routine and use it to log the workout in one click.",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Delete this routine?",
    exercise: "exercise",
    exercises: "exercises",
    use: "Use routine",
  },
};

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
  const s = useT(S);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">{s.title}</h2>
        <RoutineFormDialog
          exercises={exercises}
          label={s.new}
          variant="outline"
          size="sm"
        />
      </div>
      {routines.length === 0 ? (
        <p className="text-sm text-muted-foreground">{s.empty}</p>
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
                    label={s.edit}
                    variant="ghost"
                    size="sm"
                  />
                  <form action={deleteRoutine.bind(null, r.id)}>
                    <ConfirmSubmit
                      message={s.confirmDelete}
                      className="inline-flex h-7 items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                    >
                      {s.delete}
                    </ConfirmSubmit>
                  </form>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  {r.items.length}{" "}
                  {r.items.length === 1 ? s.exercise : s.exercises}
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
                  {s.use}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
