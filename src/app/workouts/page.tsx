import { format, parseISO, endOfWeek, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Plus } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { deleteWorkout } from "@/actions/workouts";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { WeekNav } from "@/components/workouts/week-nav";
import { WorkoutFormDialog } from "@/components/workouts/workout-form-dialog";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WORKOUT_TYPE_LABELS } from "@/lib/labels";
import {
  getWorkoutsInRange,
  type WorkoutWithSets,
} from "@/lib/queries/workouts";

export default function WorkoutsPage({ searchParams }: PageProps<"/workouts">) {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Entrenos</h1>
      <Suspense fallback={<p className="text-muted-foreground">Cargando…</p>}>
        <WorkoutsWeek searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function WorkoutsWeek({
  searchParams,
}: {
  searchParams: PageProps<"/workouts">["searchParams"];
}) {
  await connection();
  const { date: raw } = await searchParams;
  const date =
    typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? raw
      : format(new Date(), "yyyy-MM-dd");

  const current = parseISO(date);
  const weekStart = format(startOfWeek(current, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(current, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekWorkouts = await getWorkoutsInRange(weekStart, weekEnd);

  const totalMin = weekWorkouts.reduce(
    (sum, w) => sum + (w.durationMin ?? 0),
    0,
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <WeekNav date={date} />
        <WorkoutFormDialog
          defaultDate={date}
          label="Registrar entreno"
          icon={<Plus />}
          buttonClassName="ml-auto"
        />
      </div>

      <div className="grid max-w-2xl grid-cols-3 gap-3">
        <Stat label="Sesiones" value={String(weekWorkouts.length)} />
        <Stat label="Duración total" value={`${totalMin} min`} />
        <Stat
          label="Con series"
          value={String(weekWorkouts.filter((w) => w.sets.length > 0).length)}
        />
      </div>

      {weekWorkouts.length === 0 ? (
        <p className="text-muted-foreground">
          No hay entrenos registrados esta semana.
        </p>
      ) : (
        <div className="flex max-w-3xl flex-col gap-4">
          {weekWorkouts.map((w) => (
            <WorkoutCard key={w.id} workout={w} />
          ))}
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function WorkoutCard({ workout }: { workout: WorkoutWithSets }) {
  const dayLabel = format(parseISO(workout.date), "EEEE d", { locale: es });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline gap-3">
          <CardTitle className="capitalize">{dayLabel}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {WORKOUT_TYPE_LABELS[workout.type]}
            {workout.durationMin != null && ` · ${workout.durationMin} min`}
          </span>
        </div>
        <CardAction className="flex items-center gap-1">
          <WorkoutFormDialog
            defaultDate={workout.date}
            workout={workout}
            label="Editar"
            variant="ghost"
            size="sm"
          />
          <form action={deleteWorkout.bind(null, workout.id)}>
            <ConfirmSubmit
              message="¿Eliminar este entreno?"
              className="inline-flex h-7 items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
            >
              Eliminar
            </ConfirmSubmit>
          </form>
        </CardAction>
      </CardHeader>
      <CardContent>
        {workout.notes && (
          <p className="mb-2 text-sm text-muted-foreground">{workout.notes}</p>
        )}
        {workout.sets.length > 0 && (
          <details>
            <summary className="cursor-pointer text-sm text-muted-foreground">
              {workout.sets.length} ejercicio
              {workout.sets.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-2 flex flex-col gap-1 text-sm">
              {workout.sets.map((s) => (
                <li key={s.id}>
                  {s.exercise} — {s.sets}×{s.reps}
                  {s.weightKg != null && ` @ ${s.weightKg} kg`}
                </li>
              ))}
            </ul>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
