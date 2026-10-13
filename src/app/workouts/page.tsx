import { format, parseISO, endOfWeek, startOfWeek } from "date-fns";
import { Plus } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";
import { deleteWorkout } from "@/actions/workouts";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { WeekNav } from "@/components/workouts/week-nav";
import { WorkoutFormDialog } from "@/components/workouts/workout-form-dialog";
import { RoutinesSection } from "@/components/workouts/routines-section";
import { TrainingPlanSection } from "@/components/workouts/training-plan-section";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  dateFnsLocale,
  getLocale,
  t,
  type Locale,
} from "@/lib/i18n";
import { WORKOUT_TYPE_LABELS } from "@/lib/labels";
import { listExercises, type ExerciseOption } from "@/lib/queries/exercises";
import { listRoutines } from "@/lib/queries/routines";
import { getTrainingPlan } from "@/lib/queries/training-plan";
import {
  getWorkoutsInRange,
  type WorkoutWithSets,
} from "@/lib/queries/workouts";

const S = {
  es: {
    title: "Entrenos",
    logWorkout: "Registrar entreno",
    sessions: "Sesiones",
    totalDuration: "Duración total",
    withSets: "Con series",
    noWorkouts: "No hay entrenos registrados esta semana.",
    edit: "Editar",
    delete: "Eliminar",
    confirmDelete: "¿Eliminar este entreno?",
    exercise: "ejercicio",
    exercises: "ejercicios",
    min: "min",
  },
  en: {
    title: "Workouts",
    logWorkout: "Log workout",
    sessions: "Sessions",
    totalDuration: "Total duration",
    withSets: "With sets",
    noWorkouts: "No workouts logged this week.",
    edit: "Edit",
    delete: "Delete",
    confirmDelete: "Delete this workout?",
    exercise: "exercise",
    exercises: "exercises",
    min: "min",
  },
};

export default function WorkoutsPage({ searchParams }: PageProps<"/workouts">) {
  return (
    <div className="flex flex-col gap-6">
      <Suspense fallback={<p className="text-muted-foreground">…</p>}>
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
  const [{ date: raw }, locale] = await Promise.all([
    searchParams,
    getLocale(),
  ]);
  const s = t(S, locale);
  const date =
    typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? raw
      : format(new Date(), "yyyy-MM-dd");

  const current = parseISO(date);
  const weekStart = format(startOfWeek(current, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(current, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekWorkouts = await getWorkoutsInRange(weekStart, weekEnd);
  const [exercises, routines, trainingPlan] = await Promise.all([
    listExercises(),
    listRoutines(),
    getTrainingPlan(),
  ]);

  const totalMin = weekWorkouts.reduce(
    (sum, w) => sum + (w.durationMin ?? 0),
    0,
  );

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
      <div className="flex flex-wrap items-center gap-3">
        <WeekNav date={date} />
        <WorkoutFormDialog
          defaultDate={date}
          exercises={exercises}
          label={s.logWorkout}
          icon={<Plus />}
          buttonClassName="ml-auto"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label={s.sessions} value={String(weekWorkouts.length)} />
        <Stat label={s.totalDuration} value={`${totalMin} ${s.min}`} />
        <Stat
          label={s.withSets}
          value={String(weekWorkouts.filter((w) => w.sets.length > 0).length)}
        />
      </div>

      {weekWorkouts.length === 0 ? (
        <p className="text-muted-foreground">{s.noWorkouts}</p>
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-2">
          {weekWorkouts.map((w) => (
            <WorkoutCard
              key={w.id}
              workout={w}
              exercises={exercises}
              locale={locale}
            />
          ))}
        </div>
      )}

      <RoutinesSection routines={routines} exercises={exercises} date={date} />

      <TrainingPlanSection
        plan={trainingPlan}
        routines={routines}
        weekStart={weekStart}
      />
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

function WorkoutCard({
  workout,
  exercises,
  locale,
}: {
  workout: WorkoutWithSets;
  exercises: ExerciseOption[];
  locale: Locale;
}) {
  const s = t(S, locale);
  const dayLabel = format(parseISO(workout.date), "EEEE d", {
    locale: dateFnsLocale(locale),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-baseline gap-3">
          <CardTitle className="capitalize">{dayLabel}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {WORKOUT_TYPE_LABELS[locale][workout.type]}
            {workout.durationMin != null &&
              ` · ${workout.durationMin} ${s.min}`}
          </span>
        </div>
        <CardAction className="flex items-center gap-1">
          <WorkoutFormDialog
            defaultDate={workout.date}
            exercises={exercises}
            workout={workout}
            label={s.edit}
            variant="ghost"
            size="sm"
          />
          <form action={deleteWorkout.bind(null, workout.id)}>
            <ConfirmSubmit
              message={s.confirmDelete}
              className="inline-flex h-7 items-center rounded-lg px-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
            >
              {s.delete}
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
              {workout.sets.length}{" "}
              {workout.sets.length === 1 ? s.exercise : s.exercises}
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
