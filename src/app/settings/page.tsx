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
