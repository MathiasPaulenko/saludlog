import { asc, eq, inArray } from "drizzle-orm";
import { ArrowLeft, ChevronDown, Play } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { applyRoutine } from "@/actions/routines";
import { ExerciseImages } from "@/components/workouts/exercise-images";
import { db } from "@/db";
import { exercises, routineItems, routines } from "@/db/schema";
import { getLocale, type Locale } from "@/lib/i18n";

const S = {
  es: {
    back: "Volver a entrenos",
    use: "Usar rutina hoy",
    superset: "Superserie",
    sets: "series",
    reps: "reps",
    exercises: "ejercicios",
    optional: "Opcional",
    primary: "Principal",
    secondary: "Secundarios",
    howTo: "Cómo hacerlo",
    restNote:
      "En las superseries haces el primer ejercicio, descansas ~60s, haces el segundo y descansas ~90s.",
  },
  en: {
    back: "Back to workouts",
    use: "Use routine today",
    superset: "Superset",
    sets: "sets",
    reps: "reps",
    exercises: "exercises",
    optional: "Optional",
    primary: "Primary",
    secondary: "Secondary",
    howTo: "How to do it",
    restNote:
      "In supersets do the first exercise, rest ~60s, do the second and rest ~90s.",
  },
};

const MUSCLE_LABELS: Record<Locale, Record<string, string>> = {
  es: {
    abdominals: "Abdomen",
    biceps: "Bíceps",
    calves: "Gemelos",
    chest: "Pecho",
    forearms: "Antebrazos",
    glutes: "Glúteos",
    hamstrings: "Femorales",
    lats: "Dorsales",
    "lower back": "Zona lumbar",
    "middle back": "Espalda media",
    quadriceps: "Cuádriceps",
    shoulders: "Hombros",
    traps: "Trapecios",
    triceps: "Tríceps",
  },
  en: {},
};

type Superset = { label: string | null; items: RoutineItemFull[] };
type RoutineItemFull = {
  id: number;
  exercise: string;
  sets: number;
  reps: number;
  weightKg: number | null;
  optional: boolean | null;
  superset: string | null;
  catalog: {
    sourceId: string;
    level: string | null;
    equipment: string | null;
    primaryMuscles: string[];
    secondaryMuscles: string[] | null;
    instructions: string[] | null;
  } | null;
};

function parseSuperset(name: string): { superset: string | null; clean: string } {
  const m = name.match(/^([A-Z])(\d)\s*·\s*(.+)$/);
  if (!m) return { superset: null, clean: name };
  return { superset: `${m[1]}${m[2]}`, clean: m[3] };
}

function ExerciseCard({ item, s, locale }: { item: RoutineItemFull; s: (typeof S)["es"]; locale: Locale }) {
  const cat = item.catalog;
  const muscleLabel = (m: string) =>
    locale === "es" ? (MUSCLE_LABELS.es[m] ?? m) : m;
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-medium leading-tight">
            {item.exercise}
            {item.optional && (
              <span className="ml-2 rounded-md border border-muted-foreground/30 px-1.5 py-0.5 align-middle text-xs font-normal text-muted-foreground">
                {s.optional}
              </span>
            )}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {cat?.primaryMuscles.map((m) => (
              <span
                key={m}
                className="rounded-md bg-primary/15 px-2 py-0.5 text-sm font-medium text-primary"
              >
                {muscleLabel(m)}
              </span>
            ))}
            {cat?.secondaryMuscles?.slice(0, 2).map((m) => (
              <span
                key={m}
                className="rounded-md bg-muted px-2 py-0.5 text-sm text-muted-foreground"
              >
                {muscleLabel(m)}
              </span>
            ))}
          </div>
        </div>
        <div className="shrink-0 rounded-lg bg-muted px-2.5 py-1.5 text-center">
          <p className="font-mono text-lg font-semibold leading-none">
            {item.sets}×{item.reps}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {s.sets}·{s.reps}
          </p>
        </div>
      </div>
      {cat && <ExerciseImages sourceId={cat.sourceId} name={item.exercise} />}
      <div className="flex gap-3 text-sm text-muted-foreground">
        {cat?.equipment && <span>{cat.equipment}</span>}
        {cat?.level && <span>· {cat.level}</span>}
      </div>
      {cat?.instructions && cat.instructions.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-primary">
            {s.howTo}
            <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
          </summary>
          <ol className="mt-2 flex list-decimal flex-col gap-1.5 pl-4 text-sm text-muted-foreground">
            {cat.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}

export default function RoutinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense>
      <RoutineContent params={params} />
    </Suspense>
  );
}

async function RoutineContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const routineId = Number(id);
  const locale = await getLocale();
  const s = S[locale];

  const routine = await db
    .select()
    .from(routines)
    .where(eq(routines.id, routineId))
    .get();
  if (!routine) notFound();

  const items = await db
    .select()
    .from(routineItems)
    .where(eq(routineItems.routineId, routineId))
    .orderBy(asc(routineItems.position));

  const exIds = items
    .map((i) => i.exerciseId)
    .filter((x): x is number => x != null);
  const catalog =
    exIds.length > 0
      ? await db.select().from(exercises).where(inArray(exercises.id, exIds))
      : [];
  const catalogMap = new Map(catalog.map((e) => [e.id, e]));

  const full: RoutineItemFull[] = items.map((i) => {
    const { superset, clean } = parseSuperset(i.exercise);
    const cat = i.exerciseId ? catalogMap.get(i.exerciseId) : undefined;
    return {
      id: i.id,
      exercise: clean,
      sets: i.sets,
      reps: i.reps,
      weightKg: i.weightKg,
      optional: i.optional,
      superset,
      catalog: cat
        ? {
            sourceId: cat.sourceId,
            level: cat.level,
            equipment: cat.equipment,
            primaryMuscles: cat.primaryMuscles ?? [],
            secondaryMuscles: cat.secondaryMuscles,
            instructions: cat.instructions,
          }
        : null,
    };
  });

  // Agrupar items consecutivos por letra de superserie
  const groups: Superset[] = [];
  for (const item of full) {
    const letter = item.superset?.[0] ?? null;
    const last = groups[groups.length - 1];
    if (letter && last?.label === letter) {
      last.items.push(item);
    } else {
      groups.push({ label: letter, items: [item] });
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/workouts"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {s.back}
          </Link>
        </div>
        <form
          action={async () => {
            "use server";
            await applyRoutine(routineId);
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Play className="size-4" />
            {s.use}
          </button>
        </form>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">{routine.name}</h1>
        <p className="mt-1 text-base text-muted-foreground">
          {items.length} {s.exercises}
        </p>
        {routine.notes && (
          <p className="mt-3 max-w-4xl text-base leading-relaxed text-muted-foreground">
            {routine.notes}
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground/80">{s.restNote}</p>
      </div>

      <div className="flex flex-col gap-5">
        {groups.map((g) => (
          <div key={g.label ?? g.items[0].id} className="flex flex-col gap-2">
            {g.label && (
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                  {g.label}
                </span>
                <span className="text-base font-medium text-muted-foreground">
                  {s.superset} {g.label}
                </span>
              </div>
            )}
            <div
              className={
                g.items.length > 1
                  ? "grid gap-3 md:grid-cols-2"
                  : "grid gap-3 md:grid-cols-1 xl:max-w-2xl"
              }
            >
              {g.items.map((item) => (
                <ExerciseCard key={item.id} item={item} s={s} locale={locale} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
