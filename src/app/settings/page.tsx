import { Suspense } from "react";
import { saveGoalsForm } from "@/actions/goals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GOAL_LABELS } from "@/lib/labels";
import { getGoals } from "@/lib/queries/goals";

const GOAL_KEYS = ["daily_kcal", "daily_protein", "weekly_workouts"] as const;

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Metas</h1>
      <Suspense fallback={<p className="text-muted-foreground">Cargando…</p>}>
        <GoalsSection />
      </Suspense>
      <ExportSection />
    </div>
  );
}

const CSV_DOMAINS = [
  ["foods", "Alimentos"],
  ["meals", "Comidas"],
  ["workouts", "Entrenos"],
  ["habits", "Hábitos"],
  ["metrics", "Peso"],
] as const;

function ExportSection() {
  return (
    <div className="flex max-w-md flex-col gap-3 rounded-lg border border-border p-4">
      <h2 className="text-lg font-semibold">Exportar datos</h2>
      <a
        href="/api/export"
        className="w-fit text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        JSON completo (saludlog-export.json)
      </a>
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">CSV por dominio:</p>
        {CSV_DOMAINS.map(([domain, label]) => (
          <a
            key={domain}
            href={`/api/export/csv?domain=${domain}`}
            className="w-fit text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {label} (saludlog-{domain}.csv)
          </a>
        ))}
      </div>
    </div>
  );
}

async function GoalsSection() {
  const goals = await getGoals();

  return (
    <form
      action={saveGoalsForm}
      className="flex max-w-md flex-col gap-4 rounded-lg border border-border p-4"
    >
      {GOAL_KEYS.map((key) => (
        <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={`goal-${key}`}>{GOAL_LABELS[key]}</Label>
          <Input
            id={`goal-${key}`}
            name={key}
            type="number"
            min="0"
            step="any"
            defaultValue={goals[key]}
            placeholder="Sin meta"
          />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Dejá un campo vacío para desactivar esa meta.
      </p>
      <Button type="submit" className="w-fit">
        Guardar metas
      </Button>
    </form>
  );
}
